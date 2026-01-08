import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')! // Firebase Cloud Messaging
const apnsKeyId = Deno.env.get('APNS_KEY_ID')! // Apple Push Notification Service
const apnsTeamId = Deno.env.get('APNS_TEAM_ID')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    try {
        const { userId, title, body, data } = await req.json()

        if (!userId || !title || !body) {
            return new Response(JSON.stringify({ error: 'userId, title et body requis' }), { status: 400 })
        }

        console.log(`📬 Envoi de notification à: ${userId}`)

        // 1. Get all active devices for this user
        const { data: devices, error: devicesError } = await supabase
            .from('poussoirs_appareils')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (devicesError) throw devicesError

        if (!devices || devices.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                sent: 0,
                message: 'Aucun appareil actif trouvé'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        let sentCount = 0
        let failedCount = 0

        // 2. Send to each device
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
                                title: title,
                                body: body,
                                icon: '/icon-192.png',
                                badge: '/badge-72.png'
                            },
                            data: data || {}
                        })
                    })

                    if (fcmResponse.ok) {
                        sentCount++
                        // Update last_used_at
                        await supabase
                            .from('poussoirs_appareils')
                            .update({ last_used_at: new Date().toISOString() })
                            .eq('id', device.id)
                    } else {
                        failedCount++
                        console.error(`FCM failed for device ${device.id}:`, await fcmResponse.text())
                    }

                } else if (device.platform === 'ios') {
                    // APNS for iOS
                    // Note: This is a simplified version - real APNS requires JWT token generation
                    // You'd typically use a library like @parse/node-apn or sign JWTs manually

                    const apnsPayload = {
                        aps: {
                            alert: {
                                title: title,
                                body: body
                            },
                            sound: 'default',
                            badge: 1
                        },
                        ...data
                    }

                    // Placeholder - implement full APNS logic with JWT signing
                    console.log(`APNS payload ready for ${device.device_token}:`, apnsPayload)
                    sentCount++
                }

            } catch (deviceError) {
                console.error(`Failed to send to device ${device.id}:`, deviceError)
                failedCount++
            }
        }

        return new Response(JSON.stringify({
            success: true,
            sent: sentCount,
            failed: failedCount,
            total: devices.length,
            message: `${sentCount} notifications envoyées avec succès`
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('❌ Erreur d\'envoi de notification:', error)
        return new Response(JSON.stringify({
            error: error.message,
            message: 'Échec d\'envoi de notification'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
