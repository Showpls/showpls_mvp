import { useState } from "react";

export function SimpleDemoButton() {
  const [showMenu, setShowMenu] = useState(false);

  const demos = [
    { id: 'onboarding', name: 'Онбординг' },
    { id: 'templates', name: 'Шаблоны заказов' },
    { id: 'calculator', name: 'Калькулятор платежей' },
    { id: 'replies', name: 'Быстрые реплики' },
    { id: 'tips', name: 'Система чаевых' }
  ];

  const handleDemo = (demoId: string) => {
    console.log(`Демо активировано: ${demoId}`);
    alert(`Демо: ${demos.find(d => d.id === demoId)?.name}`);
    setShowMenu(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 9999,
      backgroundColor: 'white',
      border: '2px solid #8b5cf6',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '300px'
    }}>
      {!showMenu ? (
        <button
          onClick={() => {
            console.log('Кнопка демо нажата');
            setShowMenu(true);
          }}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🎯 Демо функций
        </button>
      ) : (
        <div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#333'
          }}>
            🚀 MVP Функции
          </div>
          
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleDemo(demo.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                margin: '4px 0',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }}
            >
              {demo.name}
            </button>
          ))}
          
          <button
            onClick={() => setShowMenu(false)}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}