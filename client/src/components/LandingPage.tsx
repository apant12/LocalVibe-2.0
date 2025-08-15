import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Travel-themed particle system
    class TravelParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
      type: 'compass' | 'star' | 'globe' | 'plane';

      constructor() {
        this.x = Math.random() * (canvas?.width || 800);
        this.y = Math.random() * (canvas?.height || 600);
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 4 + 2;
        this.type = ['compass', 'star', 'globe', 'plane'][Math.floor(Math.random() * 4)] as any;
        
        // Travel-themed colors
        const colors = [
          'hsl(200, 70%, 60%)', // Ocean blue
          'hsl(45, 80%, 60%)',  // Golden sand
          'hsl(120, 60%, 50%)', // Forest green
          'hsl(30, 80%, 60%)',  // Sunset orange
          'hsl(280, 60%, 60%)', // Purple mountains
          'hsl(15, 80%, 60%)'   // Desert red
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = Math.random() * 150 + 100;
        this.maxLife = this.life;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // Bounce off edges
        if (this.x < 0 || this.x > (canvas?.width || 800)) this.vx *= -1;
        if (this.y < 0 || this.y > (canvas?.height || 600)) this.vy *= -1;

        // Reset when life expires
        if (this.life <= 0) {
          this.x = Math.random() * (canvas?.width || 800);
          this.y = Math.random() * (canvas?.height || 600);
          this.life = this.maxLife;
        }
      }

      draw() {
        if (!ctx) return;
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        // Draw different shapes based on type
        switch (this.type) {
          case 'compass':
            // Draw compass rose
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
          case 'star':
            // Draw star
            this.drawStar(this.x, this.y, this.size);
            break;
          case 'globe':
            // Draw globe
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
          case 'plane':
            // Draw plane
            this.drawPlane(this.x, this.y, this.size);
            break;
        }
        ctx.restore();
      }

      drawStar(x: number, y: number, size: number) {
        if (!ctx) return;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x1 = x + size * Math.cos(angle);
          const y1 = y + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.fill();
      }

      drawPlane(x: number, y: number, size: number) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.5, y - size * 0.3);
        ctx.lineTo(x - size * 0.5, y - size * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Initialize travel particles
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push(new TravelParticle());
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* World Map Overlay */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: 2 }}>
        <div className="w-full h-full bg-gradient-to-br from-blue-900/20 via-transparent to-green-900/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='1000' height='500' viewBox='0 0 1000 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M150,200 Q200,150 250,200 T350,200 Q400,150 450,200 T550,200 Q600,150 650,200 T750,200 Q800,150 850,200' stroke='rgba(255,255,255,0.1)' fill='none' stroke-width='1'/%3E%3Cpath d='M200,300 Q250,250 300,300 T400,300 Q450,250 500,300 T600,300 Q650,250 700,300 T800,300' stroke='rgba(255,255,255,0.1)' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-green-900/30" style={{ zIndex: 3 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" style={{ zIndex: 4 }} />

      {/* Travel-themed Floating Elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 5 }}>
        {/* Compass Rose */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '30s' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border border-blue-400/50 rounded-full animate-pulse" />
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-blue-400/60" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-400/60" />
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-1 bg-green-400/60" />
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-1 bg-yellow-400/60" />
        </div>

        {/* Globe */}
        <div className="absolute top-40 right-32 w-24 h-24 border border-green-500/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}>
          <div className="absolute inset-2 border border-green-400/40 rounded-full" />
          <div className="absolute inset-4 border border-green-300/30 rounded-full" />
        </div>

        {/* Plane */}
        <div className="absolute bottom-32 left-1/4 w-20 h-20 animate-bounce" style={{ animationDelay: '1s' }}>
          <svg className="w-full h-full text-orange-400/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>

        {/* Mountains */}
        <div className="absolute bottom-20 right-20 w-16 h-16 opacity-60">
          <svg className="w-full h-full text-purple-400/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,6L11,2L5.5,11H6.5L8,9H10L11.5,11H13L14,6M18.5,11H17.5L16,9H14L12.5,11H11L14,6L17,2L18.5,11Z"/>
          </svg>
        </div>
        
        {/* Larger floating elements */}
        <div className="absolute top-1/4 left-1/3 w-48 h-48 border border-blue-500/20 rounded-full animate-spin" style={{ animationDuration: '40s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 border border-green-500/20 rounded-full animate-spin" style={{ animationDuration: '50s', animationDirection: 'reverse' }} />
        
        {/* Travel Path Lines */}
        <div className="absolute top-1/3 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="relative">
            {/* Compass Logo */}
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse shadow-2xl shadow-blue-500/50 mx-auto mb-4 relative">
              <div className="absolute inset-2 border-2 border-white/30 rounded-full" />
              <div className="absolute inset-4 border border-white/20 rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-white/80" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-2 bg-white/60" />
            </div>
            
            {/* Travel-themed floating elements around logo */}
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
          LocalVibe
        </h1>

        {/* Subtitle with travel theme */}
        <div className="text-2xl md:text-3xl text-gray-300 mb-8 font-light">
          <span className="inline-block animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            Explore
          </span>{' '}
          <span className="inline-block animate-fade-in-up text-blue-400" style={{ animationDelay: '1s' }}>
            Discover
          </span>{' '}
          <span className="inline-block animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
            Experience
          </span>
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '2s' }}>
          Embark on a journey of discovery where every destination becomes an adventure. 
          From hidden local gems to extraordinary experiences, unlock the world's secrets 
          and create memories that will last a lifetime.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '2.5s' }}>
          <button
            onClick={() => {
              console.log('Get Started button clicked!');
              onGetStarted();
            }}
            className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-green-600 text-white text-xl font-semibold rounded-full overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
          >
            {/* Button background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 group-hover:from-blue-500 group-hover:to-green-500 transition-all duration-500" />
            
            {/* Button content */}
            <span className="relative z-10 flex items-center">
              Start Your Journey
              <svg className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-green-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl w-full animate-fade-in-up" style={{ animationDelay: '3s' }}>
          {/* Feature 1 */}
          <div className="group relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Immersive Videos</h3>
            <p className="text-gray-400">Experience destinations through stunning video content</p>
          </div>

          {/* Feature 2 */}
          <div className="group relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Global Discovery</h3>
            <p className="text-gray-400">Explore experiences from around the world</p>
          </div>

          {/* Feature 3 */}
          <div className="group relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all duration-500 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Instant Booking</h3>
            <p className="text-gray-400">Book your next adventure in seconds</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: '3.5s' }}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">10K+</div>
            <div className="text-gray-400 text-sm">Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">50K+</div>
            <div className="text-gray-400 text-sm">Travelers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">100+</div>
            <div className="text-gray-400 text-sm">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">4.9★</div>
            <div className="text-gray-400 text-sm">Rating</div>
          </div>
        </div>
      </div>

      {/* Floating Action Elements */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="flex space-x-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
          }
        `
      }} />
    </div>
  );
};

export default LandingPage;
