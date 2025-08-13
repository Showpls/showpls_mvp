import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Play, 
  ArrowRight, 
  Globe, 
  Zap, 
  Shield, 
  Users,
  Camera,
  Video,
  MapPin,
  Star,
  Clock,
  Smartphone,
  Eye,
  ChevronDown,
  Languages,
  X
} from "lucide-react";

export default function NewLanding() {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('showpls-language', lang);
  };

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('landing.features.global.title'),
      desc: t('landing.features.global.description'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: t('landing.features.instant.title'),
      desc: t('landing.features.instant.description'),
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('landing.features.secure.title'),
      desc: t('landing.features.secure.description'),
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('landing.features.quality.title'),
      desc: t('landing.features.quality.description'),
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-xl p-2 border border-white/20">
          <Button
            variant={i18n.language === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeLanguage('en')}
            className="text-xs px-3 py-1"
          >
            🇺🇸 EN
          </Button>
          <Button
            variant={i18n.language === 'ru' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeLanguage('ru')}
            className="text-xs px-3 py-1"
          >
            🇷🇺 RU
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo + Brand */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              {t('landing.title')}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t('landing.description')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                onClick={() => {
                  localStorage.setItem('telegramUserId', 'demo_user_123');
                  window.location.href = '/twa';
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Play className="w-6 h-6 mr-3" />
                {t('landing.cta')}
              </Button>
              <div className="text-lg text-gray-300 flex items-center justify-center space-x-2">
                <Video className="w-5 h-5" />
                <span>{t('landing.promo')}</span>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="max-w-4xl mx-auto mb-16">


              {/* Video Player */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <video
                  key={`video-${i18n.language === 'ru' ? 'en' : 'ru'}`}
                  controls
                  className="w-full aspect-video"
                  onLoadStart={() => console.log(`Loading video: showpls-demo-${i18n.language === 'ru' ? 'en' : 'ru'}.mp4`)}
                  onError={(e) => console.error(`Video error for ${i18n.language === 'ru' ? 'en' : 'ru'}:`, e)}
                >
                  <source 
                    src={`/videos/showpls-demo-${i18n.language === 'ru' ? 'en' : 'ru'}.mp4`} 
                    type="video/mp4" 
                  />
                  {i18n.language === 'ru' ? 'Ваш браузер не поддерживает воспроизведение видео.' : 'Your browser does not support video playback.'}
                </video>
              </div>

              {/* Video Description */}
              <div className="text-center mt-4">
                <p className="text-gray-300 text-lg">
                  {t('landing.videoDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Live Stats */}
          <div className={`transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">150+</div>
                <div className="text-gray-400">{t('landing.stats.countries')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-gray-400">{t('landing.stats.uptime')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">15 {i18n.language === 'ru' ? 'мин' : 'min'}</div>
                <div className="text-gray-400">{t('landing.stats.avgTime')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">99.9%</div>
                <div className="text-gray-400">{t('landing.stats.success')}</div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {i18n.language === 'ru' ? 'Как это работает' : 'How It Works'}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Interactive Feature Cards */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-500 border-2 ${
                    activeFeature === index
                      ? 'bg-gradient-to-r ' + feature.color + ' border-white/30 scale-105'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  } backdrop-blur-sm`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${activeFeature === index ? 'bg-white/20' : 'bg-white/10'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{feature.title}</h3>
                      <p className="text-gray-300">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Visual Demo */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {i18n.language === 'ru' ? 'Активный заказ' : 'Active Order'}
                    </Badge>
                    <div className="text-sm text-gray-400">15:42</div>
                  </div>
                  
                  <div className="bg-black/50 rounded-2xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Camera className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">
                        {i18n.language === 'ru' ? 'Фото Эйфелевой башни' : 'Eiffel Tower Photos'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{i18n.language === 'ru' ? 'Париж, Франция' : 'Paris, France'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>5.0</span>
                      <span className="text-gray-400">• {i18n.language === 'ru' ? 'Анна К.' : 'Anna K.'}</span>
                    </div>
                    <div className="text-blue-400 font-bold">2.5 TON</div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-400">
                    {i18n.language === 'ru' ? 'Создатель в пути к локации...' : 'Creator is on the way to location...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative z-10 py-20 px-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            {i18n.language === 'ru' ? 'Готовы увидеть мир?' : 'Ready to See the World?'}
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            {i18n.language === 'ru' 
              ? 'Присоединяйтесь к тысячам пользователей, которые уже заказывают контент по всему миру'
              : 'Join thousands of users who are already ordering content from around the world'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              onClick={() => {
                localStorage.setItem('telegramUserId', 'demo_user_123');
                window.location.href = '/twa';
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Smartphone className="w-6 h-6 mr-3" />
              {i18n.language === 'ru' ? 'Открыть приложение' : 'Open Application'}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>

          <div className="mt-12 flex justify-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{i18n.language === 'ru' ? 'Безопасно' : 'Secure'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{i18n.language === 'ru' ? 'Быстро' : 'Fast'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'ru' ? 'Глобально' : 'Global'}</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}