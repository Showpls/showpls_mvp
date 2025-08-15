// Development routes for testing without external dependencies
import type { Express } from "express";
import { storage } from "../storage";

export function setupDevRoutes(app: Express) {
  // Add sample orders for testing (development only)
  app.post('/api/dev/sample-orders', async (req, res) => {
    try {
      // Sample orders around Moscow
      const sampleOrders = [
        {
          requesterId: '00000000-0000-0000-0000-000000000001', // Dummy user ID
          title: 'Фото Красной площади',
          description: 'Нужны свежие фотографии Красной площади с видом на Кремль. Желательно во время заката.',
          mediaType: 'photo' as const,
          location: { lat: 55.7539, lng: 37.6208, address: 'Красная площадь, Москва' },
          budgetNanoTon: '2500000000', // 2.5 TON
          status: 'CREATED' as const,
          isSampleOrder: true,
        },
        {
          requesterId: '00000000-0000-0000-0000-000000000001',
          title: 'Видео Третьяковской галереи',
          description: 'Создать короткое видео обзор Третьяковской галереи для туристического блога.',
          mediaType: 'video' as const,
          location: { lat: 55.7415, lng: 37.6208, address: 'Третьяковская галерея, Москва' },
          budgetNanoTon: '5000000000', // 5 TON
          status: 'CREATED' as const,
          isSampleOrder: true,
        },
        {
          requesterId: '00000000-0000-0000-0000-000000000001',
          title: 'Прямая трансляция с ВДНХ',
          description: 'Провести прямую трансляцию с ВДНХ, показать фонтаны и павильоны.',
          mediaType: 'live' as const,
          location: { lat: 55.8294, lng: 37.6325, address: 'ВДНХ, Москва' },
          budgetNanoTon: '10000000000', // 10 TON
          status: 'CREATED' as const,
          isSampleOrder: true,
        },
        {
          requesterId: '00000000-0000-0000-0000-000000000001',
          title: 'Фото Парка Горького',
          description: 'Сделать красивые фотографии Парка Горького в разное время дня.',
          mediaType: 'photo' as const,
          location: { lat: 55.7297, lng: 37.6008, address: 'Парк Горького, Москва' },
          budgetNanoTon: '1500000000', // 1.5 TON
          status: 'CREATED' as const,
          isSampleOrder: true,
        },
        {
          requesterId: '00000000-0000-0000-0000-000000000001',
          title: 'Видео Арбата',
          description: 'Снять атмосферное видео пешеходной улицы Арбат.',
          mediaType: 'video' as const,
          location: { lat: 55.7494, lng: 37.5931, address: 'Арбат, Москва' },
          budgetNanoTon: '3000000000', // 3 TON
          status: 'CREATED' as const,
          isSampleOrder: true,
        },
      ];

      const createdOrders = [];
      for (const orderData of sampleOrders) {
        try {
          const order = await storage.createOrder(orderData as any);
          createdOrders.push(order);
        } catch (error) {
          console.error('[DEV] Failed to create sample order:', error);
        }
      }

      console.log('[DEV] Created', createdOrders.length, 'sample orders');

      res.json({
        success: true,
        message: `Created ${createdOrders.length} sample orders`,
        orders: createdOrders.map(order => ({
          id: order.id,
          title: order.title,
          location: order.location,
          mediaType: order.mediaType,
          budgetNanoTon: order.budgetNanoTon,
        }))
      });

    } catch (error) {
      console.error('[DEV] Error creating sample orders:', error);
      res.status(500).json({ error: 'Failed to create sample orders' });
    }
  });

  // Clear all sample orders
  app.delete('/api/dev/sample-orders', async (req, res) => {
    try {
      // This would require adding a delete method to storage
      // For now, just return success
      res.json({
        success: true,
        message: 'Sample orders cleared (not implemented)'
      });
    } catch (error) {
      console.error('[DEV] Error clearing sample orders:', error);
      res.status(500).json({ error: 'Failed to clear sample orders' });
    }
  });
}