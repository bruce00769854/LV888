
import React, { useState, useEffect } from 'react';
import { LV_TRUNK_SVG } from '../constants';

interface TrunkVisualProps {
  score: number;
  triggerAnimation: boolean;
  gemIcon: string;
  addedValue?: number;
}

const TrunkVisual: React.FC<TrunkVisualProps> = ({ score, triggerAnimation, gemIcon, addedValue }) => {
  const [gems, setGems] = useState<{ id: number; left: string; delay: string }[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      // Create a small burst of gems for more impact
      const newGems = Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() + i,
        left: `${30 + Math.random() * 40}%`,
        delay: `${i * 0.1}s`
      }));
      
      setGems(prev => [...prev, ...newGems]);
      setShowPopup(true);
      
      const timer = setTimeout(() => {
        setGems(prev => prev.filter(g => !newGems.find(ng => ng.id === g.id)));
        setShowPopup(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [triggerAnimation]);

  return (
    <div className="relative w-full h-64 flex flex-col items-center justify-center overflow-hidden">
      {/* Falling Gems */}
      {gems.map(gem => (
        <div
          key={gem.id}
          className="absolute top-0 text-3xl pointer-events-none z-10"
          style={{ 
            left: gem.left, 
            animation: `fall 1s ease-in forwards`,
            animationDelay: gem.delay
          }}
        >
          {gemIcon}
        </div>
      ))}
      
      {/* Floating Score Pop-up */}
      {showPopup && addedValue && addedValue > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 z-20 pointer-events-none">
          <div className="animate-value-float font-serif font-bold text-2xl lv-gold flex items-center gap-1">
            +{addedValue}
          </div>
        </div>
      )}
      
      {/* The Trunk */}
      <div className={`w-48 h-40 transition-all duration-500 ${triggerAnimation ? 'scale-110 rotate-1' : 'hover:scale-105'}`}>
        {LV_TRUNK_SVG}
      </div>

      <div className="mt-4 text-center relative">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-black">團隊資產總額</span>
        <div className={`text-4xl font-serif lv-gold font-bold transition-all duration-300 ${triggerAnimation ? 'animate-sparkle' : ''}`}>
          {score.toLocaleString()} <span className="text-xl opacity-80">JOYAUX</span>
        </div>
        
        {/* Subtle decorative glow ring during animation */}
        {triggerAnimation && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-lv-gold/20 blur-2xl rounded-full scale-150 animate-pulse -z-10" />
        )}
      </div>

      <style>{`
        @keyframes fall {
          0% { 
            transform: translateY(-80px) rotate(0deg) scale(0.5); 
            opacity: 0; 
          }
          20% { 
            opacity: 1; 
            transform: translateY(-40px) rotate(45deg) scale(1.2);
          }
          80% { 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100px) rotate(360deg) scale(0.8); 
            opacity: 0; 
          }
        }

        @keyframes sparkle {
          0% { 
            text-shadow: 0 0 0 rgba(212, 175, 55, 0);
            transform: scale(1);
          }
          50% { 
            text-shadow: 0 0 20px rgba(212, 175, 55, 1), 0 0 30px rgba(255, 255, 255, 0.6);
            transform: scale(1.2);
            color: #fff;
          }
          100% { 
            text-shadow: 0 0 0 rgba(212, 175, 55, 0);
            transform: scale(1);
          }
        }

        @keyframes valueFloat {
          0% {
            transform: translate(-50%, 0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -60px);
            opacity: 0;
          }
        }

        .animate-sparkle {
          animation: sparkle 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-value-float {
          animation: valueFloat 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TrunkVisual;
