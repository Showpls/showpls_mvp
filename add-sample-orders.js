#!/usr/bin/env node

// Simple script to add sample orders for testing
// Run with: node add-sample-orders.js

const sampleOrders = [
  {
    requesterId: '00000000-0000-0000-0000-000000000001',
    title: 'Фото Красной площади',
    description: 'Нужны свежие фотографии Красной площади с видом на Кремль. Желательно во время заката.',
    mediaType: 'photo',
    location: { lat: 55.7539, lng: 37.6208, address: 'Красная площадь, Москва' },
    budgetNanoTon: '2500000000',
    status: 'CREATED',
    isSampleOrder: true,
  },
  {
    requesterId: '00000000-0000-0000-0000-000000000001',
    title: 'Видео Третьяковской галереи',
    description: 'Создать короткое видео обзор Третьяковской галереи для туристического блога.',
    mediaType: 'video',
    location: { lat: 55.7415, lng: 37.6208, address: 'Третьяковская галерея, Москва' },
    budgetNanoTon: '5000000000',
    status: 'CREATED',
    isSampleOrder: true,
  },
  {
    requesterId: '00000000-0000-0000-0000-000000000001',
    title: 'Прямая трансляция с ВДНХ',
    description: 'Провести прямую трансляцию с ВДНХ, показать фонтаны и павильоны.',
    mediaType: 'live',
    location: { lat: 55.8294, lng: 37.6325, address: 'ВДНХ, Москва' },
    budgetNanoTon: '10000000000',
    status: 'CREATED',
    isSampleOrder: true,
  },
  {
    requesterId: '00000000-0000-0000-0000-000000000001',
    title: 'Фото Парка Горького',
    description: 'Сделать красивые фотографии Парка Горького в разное время дня.',
    mediaType: 'photo',
    location: { lat: 55.7297, lng: 37.6008, address: 'Парк Горького, Москва' },
    budgetNanoTon: '1500000000',
    status: 'CREATED',
    isSampleOrder: true,
  },
  {
    requesterId: '00000000-0000-0000-0000-000000000001',
    title: 'Видео Арбата',
    description: 'Снять атмосферное видео пешеходной улицы Арбат.',
    mediaType: 'video',
    location: { lat: 55.7494, lng: 37.5931, address: 'Арбат, Москва' },
    budgetNanoTon: '3000000000',
    status: 'CREATED',
    isSampleOrder: true,
  },
];

async function addSampleOrders() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  console.log('Adding sample orders...');
  
  for (const order of sampleOrders) {
    try {
      const response = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${order.title}`);
      } else {
        console.log(`❌ Failed to add: ${order.title} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error adding: ${order.title} - ${error.message}`);
    }
  }
  
  console.log('Done!');
}

// Run the script
addSampleOrders().catch(console.error);
