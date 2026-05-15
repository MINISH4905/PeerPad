import { ExternalLink, Heart, Mail, Users, Sparkles } from 'lucide-react';

const AboutPage = () => (
  <div className="about-page">
    <div className="about-hero">
      <div className="about-logo">
        <Sparkles size={32} />
      </div>
      <h1 className="about-title">PeerPad</h1>
      <p className="about-tagline">Academic Sanctuary</p>
    </div>

    <div className="about-section">
      <p className="about-desc">
        PeerPad is an AI-powered student collaboration platform built to replace the fragmented chaos
        of WhatsApp, Google Docs, Drive, and personal note apps — all in one clean, real-time workspace.
      </p>
    </div>

    <div className="about-cards">
      <div className="about-card">
        <Users size={20} />
        <h3>Built for Students</h3>
        <p>Designed from the ground up for study groups, lab partners, and academic teams.</p>
      </div>
      <div className="about-card">
        <Sparkles size={20} />
        <h3>AI-First</h3>
        <p>Intelligent summaries, smart note insights, and voice transcription built right in.</p>
      </div>
      <div className="about-card">
        <Heart size={20} />
        <h3>Real-Time Sync</h3>
        <p>Every note update reflects instantly across all team members. No refreshing needed.</p>
      </div>
    </div>

    <div className="about-links">
      <a className="about-link" href="mailto:hello@peerpad.app">
        <Mail size={16} /> hello@peerpad.app
      </a>
      <a className="about-link" href="https://github.com" target="_blank" rel="noreferrer">
        <ExternalLink size={16} /> GitHub
      </a>
    </div>

    <p className="about-version">Version 1.0.0 · Made with ♥ for learners everywhere</p>
  </div>
);

export default AboutPage;