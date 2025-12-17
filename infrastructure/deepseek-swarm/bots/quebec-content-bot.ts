
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONTENT ASSETS ---

const QUEBEC_USERS = [
    { username: 'marie_tremblay_qc', displayName: 'Marie Tremblay ⚜️', bio: 'Amoureuse de Québec et de café. ☕️' },
    { username: 'jean_guy_hockey', displayName: 'Jean-Guy Lebrun', bio: 'Habs fan forever. 🏒' },
    { username: 'sophie_explore', displayName: 'Sophie Voyage', bio: 'Exploratrice des Laurentides. 🌲' },
    { username: 'poutine_king', displayName: 'Maxime Roy', bio: 'En quête de la poutine parfaite. 🍟' },
    { username: 'art_mtl', displayName: 'Camille Art', bio: 'Artiste visuelle à Montréal. 🎨' },
    { username: 'festif_quebec', displayName: 'Alexandre Festif', bio: 'Toujours au festival d\'été. 🎸' },
    { username: 'nature_gasp', displayName: 'Isabelle Gaspésie', bio: 'La mer, les montagnes, la vie. 🌊' },
];

const IMAGES = {
    general: [
        'https://images.unsplash.com/photo-1519885277449-12cee6fb671b?auto=format&fit=crop&w=800&q=80', // Montreal Winter
        'https://images.unsplash.com/photo-1570537388706-5f074d221c08?auto=format&fit=crop&w=800&q=80', // Autumn Trees
        'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80', // Hiking
        'https://images.unsplash.com/photo-1503915158626-d971578bae3f?auto=format&fit=crop&w=800&q=80', // Montreal Street
    ],
    food: [
        'https://images.unsplash.com/photo-1586548163458-299f1fa70bce?auto=format&fit=crop&w=800&q=80', // Fries/Poutine vibe
        'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80', // Maple Syrup
        'https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=800&q=80', // Brunch
    ],
    sports: [
        'https://images.unsplash.com/photo-1515704089429-fd06e6668458?auto=format&fit=crop&w=800&q=80', // Hockey
        'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=800&q=80', // Skating
    ],
    culture: [
        'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80', // Concert
        'https://images.unsplash.com/photo-1599582489674-32537c35a6be?auto=format&fit=crop&w=800&q=80', // Quebec Architecture
    ]
};

const POST_TEMPLATES = [
    // Actualités / General
    { text: "Quelle belle journée pour une promenade dans le Vieux-Québec! 🏰 #Québec #VieuxQuébec", type: 'general' },
    { text: "L'automne au Québec, c'est vraiment magique. Les couleurs sont incroyables cette année. 🍁 #Automne #Couleurs", type: 'general' },
    { text: "On est chanceux d'avoir autant de beaux parcs à Montréal. Profitez-en! 🌳 #MTL #Nature", type: 'general' },
    { text: "Bon matin tout le monde! Un bon café pour commencer la journée, c'est essentiel. ☕️ #Matindetrempe", type: 'general' },
    { text: "Qui va au Carnaval cette année? J'ai trop hâte de voir Bonhomme! ⛄️ #CarnavalDeQuebec", type: 'general' },

    // Food
    { text: "Rien de mieux qu'une bonne poutine pour se réchauffer. Ashton ou La Banquise? Débat lancé! 🍟 #Poutine #Débat", type: 'food' },
    { text: "Cabane à sucre ce week-end! La tire d'érable sur la neige, miam! 🍁 #CabaneASucre #Erable", type: 'food' },
    { text: "Bagel St-Viateur ou Fairmount? La question éternelle de Montréal. 🥯 #Bagel #MTLFood", type: 'food' },
    { text: "Souper tourtière ce soir. La recette de grand-maman est imbattable. 🥧 #Tradition", type: 'food' },

    // Sports
    { text: "Quelle game hier soir! Les Canadiens nous ont fait vivre des émotions! 🔵⚪️🔴 #GoHabsGo #CH", type: 'sports' },
    { text: "Patinoire extérieure ce soir? La glace est parfaite au parc Lafontaine. ⛸️ #Patin", type: 'sports' },
    { text: "Le Rouge et Or continue de dominer! Fière de notre équipe locale. 🏈 #Football #Quebec", type: 'sports' },

    // Culture
    { text: "Le nouveau film de ce réalisateur québécois est un chef-d'œuvre. Allez le voir! 🎬 #CinémaQuébécois", type: 'culture' },
    { text: "En boucle dans mes oreilles: Les Cowboys Fringants. Toujours aussi pertinent. 🎶 #MusiqueQC", type: 'culture' },
    { text: "Festival d'été de Québec: la programmation est malade cette année! 🔥 #FEQ", type: 'culture' },
    { text: "Exposition incroyable au Musée des Beaux-Arts. À ne pas manquer. 🖼️ #MBAM #Art", type: 'culture' }
];

// --- BOT CLASS ---

class QuebecContentBot {
    private users: any[] = [];

    constructor() { }

    async initialize() {
        console.log("🤖 Initializing QuebecContentBot...");

        // 1. Fetch existing users to post as
        const { data: existingUsers, error } = await supabase
            .from('user_profiles')
            .select('id, username');

        if (error) {
            console.error("Error fetching users:", error);
        }

        if (existingUsers && existingUsers.length > 0) {
            console.log(`✅ Found ${existingUsers.length} existing users to utilize.`);
            this.users = existingUsers;
        } else {
            console.warn("⚠️ No users found in DB. Content usage might fail due to Foreign Key constraints.");
        }
    }

    async generatePosts(count: number = 50) {
        console.log(`🚀 Starting generation of ${count} posts...`);

        if (this.users.length === 0) {
            console.error("❌ Aborting: No users available to author posts.");
            return;
        }

        let successCount = 0;

        for (let i = 0; i < count; i++) {
            // 1. Select Random User
            const author = this.users[Math.floor(Math.random() * this.users.length)];

            // 2. Select Random Template
            const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];

            // 3. Select Image based on type
            const images = IMAGES[template.type as keyof typeof IMAGES] || IMAGES.general;
            const imageUrl = images[Math.floor(Math.random() * images.length)];

            // 4. Create Post Object
            // Randomize time slightly to mock organic history (last 7 days)
            const daysAgo = Math.floor(Math.random() * 7);
            const hoursAgo = Math.floor(Math.random() * 24);
            const fakeDate = new Date();
            fakeDate.setDate(fakeDate.getDate() - daysAgo);
            fakeDate.setHours(fakeDate.getHours() - hoursAgo);

            const postData = {
                user_id: author.id,
                media_url: imageUrl,
                content: template.text, // Updated to 'content'
                visibilite: 'public',
                reactions_count: Math.floor(Math.random() * 150),
                comments_count: Math.floor(Math.random() * 20),
                created_at: fakeDate.toISOString(),
            };

            try {
                const { error } = await supabase.from('publications').insert(postData);

                if (error) {
                    console.error(`❌ Failed to insert post ${i + 1}:`, error.message);
                } else {
                    successCount++;
                    if ((i + 1) % 10 === 0) {
                        console.log(`✅ Generated ${i + 1}/${count} posts...`);
                    }
                }
            } catch (e) {
                console.error("Exception during insert:", e);
            }
        }

        console.log(`🎉 Mission Complete: ${successCount} posts generated successfully!`);
    }
}

// --- RUNNER ---

const run = async () => {
    const bot = new QuebecContentBot();
    await bot.initialize();

    // Parse args
    const args = process.argv.slice(2);
    const countArg = args.find(a => a.startsWith('--generate='));
    const count = countArg ? parseInt(countArg.split('=')[1]) : 50;

    await bot.generatePosts(count);
};

run().catch(console.error);
