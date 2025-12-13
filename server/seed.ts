/**
 * Seed script to populate the database with sample data
 */
import { db } from './storage';
import { users, posts, follows, stories } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const demoUsers = [
      {
        username: 'tiguy_officiel',
        email: 'tiguy@zyeute.ca',
        password: hashedPassword,
        displayName: 'Ti-Guy Officiel',
        bio: 'Le mascotte officiel de Zyeuté! 🦫 Bienvenue au Québec!',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tiguy',
        region: 'montreal' as const,
        isVerified: true,
      },
      {
        username: 'marie_montreal',
        email: 'marie@example.com',
        password: hashedPassword,
        displayName: 'Marie Tremblay',
        bio: 'Photographe passionnée de Montréal 📸 J\'aime capturer la beauté du Québec!',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
        region: 'montreal' as const,
        isVerified: false,
      },
      {
        username: 'jean_quebec',
        email: 'jean@example.com',
        password: hashedPassword,
        displayName: 'Jean Côté',
        bio: 'Vidéaste de Québec City 🎬 Découvrez le vieux Québec avec moi!',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
        region: 'quebec' as const,
        isVerified: false,
      },
      {
        username: 'sophie_gaspesie',
        email: 'sophie@example.com',
        password: hashedPassword,
        displayName: 'Sophie Gagnon',
        bio: 'Nature lover en Gaspésie 🌲🌊 Photos de la côte et des montagnes',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie',
        region: 'gaspesie' as const,
        isVerified: true,
      },
      {
        username: 'demo',
        email: 'demo@zyeute.ca',
        password: hashedPassword,
        displayName: 'Demo User',
        bio: 'Compte demo pour tester Zyeuté',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        region: 'montreal' as const,
        isVerified: false,
      },
    ];
    
    const createdUsers = await db.insert(users).values(demoUsers).returning();
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Create sample posts - 25+ Quebec-themed posts for rich content
    const samplePosts = [
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=800',
        caption: 'Bienvenue sur Zyeuté! L\'app sociale du Québec 🔥⚜️ Rejoins la communauté!',
        hashtags: ['zyeute', 'quebec', 'bienvenue'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 156,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        caption: 'Le vieux port de Montréal au coucher du soleil 🌅 C\'est tellement beau!',
        hashtags: ['montreal', 'vieuxport', 'sunset'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 89,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
        caption: 'Le Château Frontenac, toujours aussi majestueux! 🏰 #patrimoine',
        hashtags: ['quebec', 'frontenac', 'histoire'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 234,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        caption: 'Le rocher Percé au lever du soleil 🌄 Un vrai bijou de la Gaspésie!',
        hashtags: ['gaspesie', 'perce', 'nature'],
        region: 'gaspesie' as const,
        visibility: 'public' as const,
        fireCount: 312,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        caption: 'Randonnée au Mont-Royal avec une vue incroyable! 🏔️',
        hashtags: ['montreal', 'montroyal', 'hiking'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 67,
      },
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        caption: 'Une bonne poutine pour commencer la journée! 🍟🧀 Miam!',
        hashtags: ['poutine', 'quebec', 'foodie'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 445,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
        caption: 'Les lumières de la ville de Québec la nuit ✨ Magique!',
        hashtags: ['quebec', 'nightlife', 'cityscape'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 178,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        caption: 'La forêt boréale en automne 🍂 Les couleurs sont folles cette année!',
        hashtags: ['automne', 'nature', 'quebec'],
        region: 'gaspesie' as const,
        visibility: 'public' as const,
        fireCount: 523,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        caption: 'Vue sur le centre-ville depuis le belvédère 🌆',
        hashtags: ['montreal', 'skyline', 'view'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 134,
      },
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        caption: 'Brunch du dimanche dans le Plateau! ☕🥐',
        hashtags: ['brunch', 'plateau', 'montreal'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 289,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        caption: 'Le fleuve St-Laurent au petit matin 🌊 Tellement paisible',
        hashtags: ['stlaurent', 'fleuve', 'quebec'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 201,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        caption: 'Les Chic-Chocs en hiver ❄️🏔️ Le paradis du ski!',
        hashtags: ['chicchocs', 'ski', 'hiver'],
        region: 'gaspesie' as const,
        visibility: 'public' as const,
        fireCount: 387,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
        caption: 'Street art dans le Mile End 🎨 Montréal a tellement de talent!',
        hashtags: ['streetart', 'mileend', 'art'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 156,
      },
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        caption: 'Souper gastronomique québécois 🍽️ Du terroir dans l\'assiette!',
        hashtags: ['gastronomie', 'terroir', 'quebec'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 267,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        caption: 'Week-end au spa dans les Laurentides 💆‍♀️ On mérite ça!',
        hashtags: ['spa', 'laurentides', 'relaxation'],
        region: 'laval' as const,
        visibility: 'public' as const,
        fireCount: 198,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
        caption: 'Observation des baleines à Tadoussac 🐋 Incroyable!',
        hashtags: ['baleines', 'tadoussac', 'nature'],
        region: 'gaspesie' as const,
        visibility: 'public' as const,
        fireCount: 612,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
        caption: 'Festival de Jazz 🎷🎺 L\'ambiance est malade!',
        hashtags: ['jazz', 'festival', 'montreal'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 445,
      },
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
        caption: 'Cabane à sucre! 🍁 Le temps des sucres c\'est le meilleur temps!',
        hashtags: ['cabane', 'siroperable', 'tradition'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 534,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27abb37f?w=800',
        caption: 'Hockey au Centre Bell 🏒🔥 Go Habs Go!',
        hashtags: ['hockey', 'habs', 'centrebell'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 723,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
        caption: 'Kayak sur le Saguenay 🛶 La nature sauvage du Québec!',
        hashtags: ['kayak', 'saguenay', 'aventure'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 356,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?w=800',
        caption: 'La Fête Nationale! 🎆⚜️ Bonne St-Jean à tous!',
        hashtags: ['stjean', 'fetenationale', 'quebec'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 892,
      },
      {
        userId: createdUsers[0].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
        caption: 'Route panoramique en Charlevoix 🚗 Chaque virage est une carte postale!',
        hashtags: ['charlevoix', 'roadtrip', 'paysage'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 278,
      },
      {
        userId: createdUsers[2].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        caption: 'Coworking à Montréal 💻 La scène tech québécoise est en feu!',
        hashtags: ['tech', 'startup', 'montreal'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 145,
      },
      {
        userId: createdUsers[3].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800',
        caption: 'Tempête de neige à Québec ❄️ On est faits forts icitte!',
        hashtags: ['hiver', 'neige', 'quebec'],
        region: 'quebec' as const,
        visibility: 'public' as const,
        fireCount: 234,
      },
      {
        userId: createdUsers[1].id,
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        caption: 'Portrait dans le Vieux-Montréal 📸 Cette lumière!',
        hashtags: ['portrait', 'vieuxmontreal', 'photo'],
        region: 'montreal' as const,
        visibility: 'public' as const,
        fireCount: 189,
      },
    ];
    
    const createdPosts = await db.insert(posts).values(samplePosts).returning();
    console.log(`✅ Created ${createdPosts.length} posts`);
    
    // Create some follows (demo user follows everyone)
    const demoUser = createdUsers.find(u => u.username === 'demo');
    if (demoUser) {
      const followData = createdUsers
        .filter(u => u.id !== demoUser.id)
        .map(u => ({
          followerId: demoUser.id,
          followingId: u.id,
        }));
      
      await db.insert(follows).values(followData);
      console.log(`✅ Created ${followData.length} follow relationships`);
    }
    
    // Create sample stories
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const sampleStories = [
      {
        userId: createdUsers[0].id,
        mediaUrl: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=800',
        mediaType: 'photo',
        caption: 'Nouvelle journée sur Zyeuté!',
        expiresAt,
      },
      {
        userId: createdUsers[1].id,
        mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        mediaType: 'photo',
        caption: 'Belle vue ce matin!',
        expiresAt,
      },
    ];
    
    const createdStories = await db.insert(stories).values(sampleStories).returning();
    console.log(`✅ Created ${createdStories.length} stories`);
    
    console.log('\n🎉 Seeding complete!');
    console.log('\n📝 Demo login credentials:');
    console.log('   Email: demo@zyeute.ca');
    console.log('   Password: demo123');
    console.log('\n   Or use any of the created accounts with password: demo123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
