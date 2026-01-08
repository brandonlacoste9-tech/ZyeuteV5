import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Quebec French slang that should NOT be flagged as offensive normally, 
// but we still moderate for illegal/harmful intent.
const JOUAL_WHITELIST = [
    'câlisse', 'tabarnak', 'crisse', 'ostie', 'sacrament',
    'maudit', 'toé', 'moé', 'icitte', 'asteure', 'chu', 'jsuis'
]

const SYSTEM_PROMPT = `
You are the Zyeuté Safety Guardian, a content moderation AI for a social platform in Quebec.
You must strictly enforce our Safety Standards.

POLICY:
- ZERO TOLERANCE for child luring, grooming, or inappropriate interaction with minors.
- Strict moderation of hate speech, illegal acts, and extreme violence.
- Professional Joual (Quebec slang) is PERMITTED unless used to harass or violate policy.

Your task:
Analyze the provided content and return a JSON object with:
{
  "approved": boolean,
  "flagged_categories": string[],
  "severity_score": number (0-10),
  "is_minor_danger": boolean,
  "reasoning": string
}

If "is_minor_danger" is true, the account will be PERMANENTLY BANNED. Be absolutely sure.
`;

serve(async (req) => {
    try {
        const { publicationId, content, caption, userId } = await req.json()

        if (!publicationId) {
            return new Response(JSON.stringify({ error: 'Publication ID requis' }), { status: 400 })
        }

        const textToModerate = `Légende: ${caption || ''} | Contenu: ${content || ''}`.trim()

        if (!textToModerate) {
            return new Response(JSON.stringify({
                approved: true,
                message: 'Aucun contenu à modérer'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        console.log(`🛡️ Modération (Powered by DeepSeek) lancée pour: ${publicationId}`)

        // 1. Call DeepSeek for Cognitive Moderation
        const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${deepseekApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Analyze this content for publication ${publicationId}:\n\n${textToModerate}` }
                ],
                response_format: { type: 'json_object' }
            })
        })

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`DeepSeek API Failure: ${aiResponse.status} - ${errText}`)
        }

        const aiData = await aiResponse.json()
        const result = JSON.parse(aiData.choices[0].message.content)

        console.log(`📊 Résultat IA: Approved=${result.approved}, MinorDanger=${result.is_minor_danger}`)

        // 2. Update publication moderation status
        const { error: updateError } = await supabase
            .from('publications')
            .update({
                is_moderated: true,
                moderation_approved: result.approved,
                moderation_score: result.severity_score,
                moderated_at: new Date().toISOString()
            })
            .eq('id', publicationId)

        if (updateError) throw updateError

        // 3. Handle Flags
        if (!result.approved) {
            await supabase
                .from('publications')
                .update({ est_masque: true })
                .eq('id', publicationId)

            console.log('⚠️ Publication masquée car non approuvée')
        }

        // 4. CRITICAL: Handle Child Luring / Minor Danger
        if (result.is_minor_danger && userId) {
            console.log(`🚨 DANGER MINEURS DÉTECTÉ. Bannissement immédiat de l'utilisateur: ${userId}`)
            
            // Record persistent moderation log
            await supabase.from('moderation_logs').insert({
                user_id: userId,
                post_id: publicationId,
                action: 'ban',
                reason: 'minor_danger',
                details: result.reasoning,
                score: result.severity_score
            })

            // Mark user as banned in profiles
            const { error: banError } = await supabase
                .from('user_profiles')
                .update({ 
                    role: 'banned', 
                    bio: 'COMPTE DÉSACTIVÉ : Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs.' 
                })
                .eq('id', userId)

            if (banError) console.error('Erreur lors du bannissement:', banError)
            
            // Optionally, we could delete the post entirely or hide it further.
        }

        return new Response(JSON.stringify({
            success: true,
            approved: result.approved,
            is_minor_danger: result.is_minor_danger,
            message: result.approved ? 'Contenu approuvé' : 'Contenu rejeté par le Gardien Zyeuté'
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('❌ Erreur de modération:', error)
        return new Response(JSON.stringify({
            error: error.message,
            message: 'Échec de la modération'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
