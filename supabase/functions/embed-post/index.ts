import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    try {
        const { record } = await req.json()

        // 1. Content extract: caption + content
        const content = `${record.caption || ''} ${record.content || ''}`.trim()

        if (!content) {
            return new Response(JSON.stringify({ error: 'No content to embed' }), { status: 400 })
        }

        // 2. Generate embedding using Supabase AI (Transformers)
        // Note: This requires the @supabase/ai-js or calling a model via fetch
        // For this implementation, we assume we use an external model like GTE-small
        // via a standard embedding API or Supabase's native AI support.

        // Hypothesizing usage of Supabase's future-facing AI helper or a standard fetch to HL
        const embeddingResponse = await fetch('https://api-inference.huggingface.co/models/thenlper/gte-small', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('HUGGINGFACE_API_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: content })
        })

        const embedding = await embeddingResponse.json()

        if (!Array.isArray(embedding)) {
            throw new Error('Failed to generate embedding array')
        }

        // 3. Update the publication
        const { error: updateError } = await supabase
            .from('publications')
            .update({
                embedding: embedding,
                last_embedded_at: new Date().toISOString()
            })
            .eq('id', record.id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
