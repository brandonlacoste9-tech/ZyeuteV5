import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Quebec French slang that should NOT be flagged as offensive
const JOUAL_WHITELIST = [
    'câlisse', 'tabarnak', 'crisse', 'ostie', 'sacrament',
    'maudit', 'toé', 'moé', 'icitte', 'asteure', 'chu', 'jsuis'
]

serve(async (req) => {
    try {
        const { publicationId, content, caption } = await req.json()

        if (!publicationId) {
            return new Response(JSON.stringify({ error: 'Publication ID requis' }), { status: 400 })
        }

        const textToModerate = `${caption || ''} ${content || ''}`.trim()

        if (!textToModerate) {
            return new Response(JSON.stringify({
                approved: true,
                message: 'Aucun contenu à modérer'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        console.log(`🛡️ Modération lancée pour: ${publicationId}`)

        // 1. Call OpenAI Moderation API
        const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: textToModerate,
                model: 'text-moderation-latest'
            })
        })

        if (!moderationResponse.ok) {
            throw new Error('Erreur API de modération')
        }

        const moderationData = await moderationResponse.json()
        const result = moderationData.results[0]

        // 2. Check if content is flagged
        let isFlagged = result.flagged
        const categories = result.categories
        const scores = result.category_scores

        // 3. Apply Quebec context: Don't flag common Joual expressions
        if (isFlagged) {
            const hasJoualOnly = JOUAL_WHITELIST.some(word =>
                textToModerate.toLowerCase().includes(word)
            )

            // If only flagged for "profanity" and contains Joual, allow it
            if (hasJoualOnly && categories.sexual === false && categories.violence === false && categories.hate === false) {
                isFlagged = false
                console.log('✅ Joual détecté - contenu approuvé malgré le langage coloré')
            }
        }

        // 4. Update publication moderation status
        const { error: updateError } = await supabase
            .from('publications')
            .update({
                is_moderated: true,
                moderation_approved: !isFlagged,
                moderation_score: scores.hate + scores.violence + scores.sexual,
                moderated_at: new Date().toISOString()
            })
            .eq('id', publicationId)

        if (updateError) throw updateError

        // 5. If flagged, hide the post automatically
        if (isFlagged) {
            await supabase
                .from('publications')
                .update({ est_masque: true })
                .eq('id', publicationId)

            console.log('⚠️ Publication masquée automatiquement')
        }

        return new Response(JSON.stringify({
            success: true,
            approved: !isFlagged,
            categories,
            message: isFlagged ? 'Contenu masqué pour modération' : 'Contenu approuvé'
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
