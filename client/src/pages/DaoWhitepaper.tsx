import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Shield, 
  Coins, 
  Users, 
  Globe,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";

export default function DaoWhitepaper() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="glass-panel p-4 mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('whitepaper.back')}
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center mr-3">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Showpls DAO</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 brand-gradient-text">
            Showpls DAO
          </h1>
          <p className="text-xl text-text-muted mb-8 max-w-2xl mx-auto">
            {t('whitepaper.subtitle')}
          </p>
          <Button className="gradient-bg text-white px-8 py-4 rounded-xl font-semibold text-lg">
            <Download className="w-5 h-5 mr-2" />
            {t('whitepaper.downloadPdf')}
          </Button>
        </div>

        {/* Executive Summary */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6">{t('whitepaper.executiveSummary')}</h2>
            <p className="text-lg text-text-muted leading-relaxed">
              {t('whitepaper.executiveText')}
            </p>
          </CardContent>
        </Card>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-panel border-brand-primary/20">
            <CardContent className="p-6">
              <Target className="w-12 h-12 text-brand-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">{t('whitepaper.mission')}</h3>
              <p className="text-text-muted">
                {t('whitepaper.missionText')}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-brand-primary/20">
            <CardContent className="p-6">
              <TrendingUp className="w-12 h-12 text-brand-accent mb-4" />
              <h3 className="text-2xl font-bold mb-4">{t('whitepaper.vision')}</h3>
              <p className="text-text-muted">
                {t('whitepaper.visionText')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8">{t('whitepaper.technology')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.blockchain')}</h4>
                <p className="text-text-muted text-sm">
                  {t('whitepaper.blockchainText')}
                </p>
              </div>
              <div className="text-center">
                <Zap className="w-16 h-16 text-brand-accent mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.smartContracts')}</h4>
                <p className="text-text-muted text-sm">
                  {t('whitepaper.smartContractsText')}
                </p>
              </div>
              <div className="text-center">
                <Globe className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.decentralized')}</h4>
                <p className="text-text-muted text-sm">
                  {t('whitepaper.decentralizedText')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokenomics */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8">{t('whitepaper.tokenomics')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold mb-4 flex items-center">
                  <Coins className="w-6 h-6 text-brand-accent mr-2" />
                  {t('whitepaper.tokenDistribution')}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('whitepaper.community')}</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('whitepaper.team')}</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('whitepaper.ecosystem')}</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('whitepaper.treasury')}</span>
                    <span className="font-semibold">15%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="w-6 h-6 text-brand-primary mr-2" />
                  {t('whitepaper.governance')}
                </h4>
                <p className="text-text-muted">
                  {t('whitepaper.governanceText')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8">{t('whitepaper.roadmap')}</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-brand-primary pl-6">
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.phase1')}</h4>
                <p className="text-text-muted">{t('whitepaper.phase1Text')}</p>
              </div>
              <div className="border-l-4 border-brand-accent pl-6">
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.phase2')}</h4>
                <p className="text-text-muted">{t('whitepaper.phase2Text')}</p>
              </div>
              <div className="border-l-4 border-text-muted pl-6">
                <h4 className="text-xl font-semibold mb-2">{t('whitepaper.phase3')}</h4>
                <p className="text-text-muted">{t('whitepaper.phase3Text')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download CTA */}
        <Card className="glass-panel border-brand-primary/20 mb-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{t('whitepaper.getFullDocument')}</h3>
            <p className="text-text-muted mb-6">{t('whitepaper.fullDocumentText')}</p>
            <Button className="gradient-bg text-white px-8 py-3 rounded-xl font-semibold text-lg">
              <Download className="w-5 h-5 mr-2" />
              {t('whitepaper.downloadFullPdf')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
