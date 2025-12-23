const { Cafeteria, MealMenu, Event } = require('../models');

/**
 * Seed Part 3 data: Cafeterias, Sample Menus, Sample Events
 */
const seedPart3Data = async () => {
    try {
        console.log('🌱 [Part3Seed] Starting Part 3 data seed...');

        // Check if Cafeteria model exists
        if (!Cafeteria) {
            console.error('❌ [Part3Seed] Cafeteria model not found!');
            return;
        }
        console.log('✓ [Part3Seed] Cafeteria model loaded');

        // Get or create cafeterias
        const [cafeteria1] = await Cafeteria.findOrCreate({
            where: { name: 'Ana Yemekhane' },
            defaults: {
                location: 'Merkez Kampüs, A Blok',
                open_hours: 'Öğle: 11:30-14:00, Akşam: 17:30-20:00',
                capacity: 500,
                is_active: true
            }
        });
        console.log(`✅ [Part3Seed] Ana Yemekhane ready (id: ${cafeteria1.id})`);

        const [cafeteria2] = await Cafeteria.findOrCreate({
            where: { name: 'Mühendislik Yemekhanesi' },
            defaults: {
                location: 'Mühendislik Fakültesi, B Blok',
                open_hours: 'Öğle: 12:00-14:30, Akşam: 18:00-20:30',
                capacity: 200,
                is_active: true
            }
        });
        console.log(`✅ [Part3Seed] Mühendislik Yemekhanesi ready (id: ${cafeteria2.id})`);

        // Check Events
        const eventCount = await Event.count();
        console.log(`📊 [Part3Seed] Existing events: ${eventCount}`);

        // Create sample menus for next 7 days
        const today = new Date();
        const menuItems = [
            {
                meal_type: 'lunch',
                items_json: [
                    { name: 'Mercimek Çorbası', description: 'Geleneksel kırmızı mercimek çorbası' },
                    { name: 'Tavuk Sote', description: 'Sebzeli tavuk sote' },
                    { name: 'Pilav', description: 'Tereyağlı pilav' },
                    { name: 'Salata', description: 'Mevsim salata' }
                ],
                nutrition_json: { calories: 750, protein: 35, carbs: 85, fat: 25 },
                price: 25.00
            },
            {
                meal_type: 'dinner',
                items_json: [
                    { name: 'Domates Çorbası', description: 'Kremalı domates çorbası' },
                    { name: 'Kuru Fasulye', description: 'Geleneksel kuru fasulye' },
                    { name: 'Bulgur Pilavı', description: 'Şehriyeli bulgur pilavı' },
                    { name: 'Cacık', description: 'Yoğurtlu cacık' }
                ],
                nutrition_json: { calories: 680, protein: 28, carbs: 90, fat: 20 },
                price: 22.00
            }
        ];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().slice(0, 10);

            for (const menu of menuItems) {
                await MealMenu.findOrCreate({
                    where: {
                        cafeteria_id: cafeteria1.id,
                        date: dateStr,
                        meal_type: menu.meal_type
                    },
                    defaults: {
                        ...menu,
                        is_published: true
                    }
                });
            }
        }

        console.log('✅ Meal menus seeded');

        // Create sample events
        const sampleEvents = [
            {
                title: 'Yazılım Geliştirme Workshop',
                description: 'React ve Node.js ile modern web uygulamaları geliştirme workshopu. Katılımcılar pratik uygulamalar yapacak.',
                category: 'workshop',
                date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                start_time: '10:00',
                end_time: '16:00',
                location: 'Bilgisayar Mühendisliği Lab 1',
                capacity: 30,
                is_paid: false,
                status: 'published'
            },
            {
                title: 'Kariyer Günleri 2024',
                description: 'Türkiye\'nin önde gelen teknoloji şirketleri ile tanışma fırsatı. CV danışmanlığı ve iş görüşmeleri.',
                category: 'career',
                date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                start_time: '09:00',
                end_time: '17:00',
                location: 'Kongre Merkezi',
                capacity: 500,
                is_paid: false,
                status: 'published'
            },
            {
                title: 'Yapay Zeka Konferansı',
                description: 'Yapay zeka ve makine öğrenmesi alanında son gelişmeler. Akademisyenler ve sektör temsilcileri katılacak.',
                category: 'conference',
                date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                start_time: '09:30',
                end_time: '18:00',
                location: 'Ana Konferans Salonu',
                capacity: 200,
                is_paid: true,
                price: 50.00,
                status: 'published'
            },
            {
                title: 'Spor Turnuvası - Futbol',
                description: 'Fakülteler arası futbol turnuvası. Takım kayıtları açık!',
                category: 'sports',
                date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                start_time: '14:00',
                end_time: '19:00',
                location: 'Kampüs Spor Sahası',
                capacity: 100,
                is_paid: false,
                status: 'published'
            }
        ];

        for (const eventData of sampleEvents) {
            await Event.findOrCreate({
                where: { title: eventData.title },
                defaults: eventData
            });
        }

        console.log('✅ Events seeded');
        console.log('🎉 Part 3 seed data completed!');

    } catch (error) {
        console.error('❌ Part 3 seed error:', error.message);
        throw error;
    }
};

module.exports = { seedPart3Data };
