import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Notification Worker - Processes pending notifications from the queue
 * Run this on a schedule (e.g., every 30 seconds via cron)
 */
serve(async (_req) => {
    try {
        console.log('🔄 Processing notification queue...')

        // 1. Fetch pending notifications (limit to avoid timeout)
        const { data: pendingNotifications, error: fetchError } = await supabase
            .from('notification_queue')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(50)

        if (fetchError) throw fetchError

        if (!pendingNotifications || pendingNotifications.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                processed: 0,
                message: 'Aucune notification en attente'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        let successCount = 0
        let failureCount = 0

        // 2. Process each notification
        for (const notification of pendingNotifications) {
            try {
                // Get active devices for this user
                const { data: devices, error: devicesError } = await supabase
                    .from('poussoirs_appareils')
                    .select('*')
                    .eq('user_id', notification.user_id)
                    .eq('is_active', true)

                if (devicesError) {
                    console.error(`Failed to fetch devices for user ${notification.user_id}:`, devicesError)
                    failureCount++
                    continue
                }

                if (!devices || devices.length === 0) {
                    // Mark as sent even though no devices (user hasn't registered yet)
                    await supabase
                        .from('notification_queue')
                        .update({ status: 'sent', sent_at: new Date().toISOString() })
                        .eq('id', notification.id)
                    successCount++
                    continue
                }

                // Send to each device
                let deviceSuccessCount = 0
                for (const device of devices) {
                    try {
                        if (device.platform === 'android' || device.platform === 'web') {
                            // FCM for Android/Web
                            const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `key=${fcmServerKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    to: device.device_token,
                                    notification: {
                                        title: notification.title,
                                        body: notification.body,
                                        icon: '/icon-192.png',
                                        badge: '/badge-72.png'
                                    },
                                    data: notification.data || {}
                                })
                            })

                            if (fcmResponse.ok) {
                                deviceSuccessCount++
                                await supabase
                                    .from('poussoirs_appareils')
                                    .update({ last_used_at: new Date().toISOString() })
                                    .eq('id', device.id)
                            } else {
                                const errorText = await fcmResponse.text()
                                console.error(`FCM failed for device ${device.id}:`, errorText)

                                // Deactivate device if token is invalid
                                if (errorText.includes('InvalidRegistration') || errorText.includes('NotRegistered')) {
                                    await supabase
                                        .from('poussoirs_appareils')
                                        .update({ is_active: false })
                                        .eq('id', device.id)
                                }
                            }
                        } else if (device.platform === 'ios') {
                            // APNS for iOS (placeholder - requires JWT signing)
                            console.log(`APNS delivery for iOS device ${device.id} - implement with proper JWT`)
                            deviceSuccessCount++
                        }
                    } catch (deviceError) {
                        console.error(`Failed to send to device ${device.id}:`, deviceError)
                    }
                }

                // Update notification status
                const status = deviceSuccessCount > 0 ? 'sent' : 'failed'
                await supabase
                    .from('notification_queue')
                    .update({
                        status,
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', notification.id)

                if (status === 'sent') {
                    successCount++
                } else {
                    failureCount++
                }

            } catch (notificationError) {
                console.error(`Failed to process notification ${notification.id}:`, notificationError)

                // Mark as failed
                await supabase
                    .from('notification_queue')
                    .update({ status: 'failed' })
                    .eq('id', notification.id)

                failureCount++
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: successCount + failureCount,
            sent: successCount,
            failed: failureCount,
            message: `Traité ${successCount + failureCount} notifications (${successCount} envoyées, ${failureCount} échouées)`
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('❌ Worker error:', error)
        return new Response(JSON.stringify({
            error: error.message,
            message: 'Échec du traitement des notifications'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
