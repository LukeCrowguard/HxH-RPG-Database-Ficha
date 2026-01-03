import React from 'react';

export const BackgroundWorld: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(circle_at_center,#130a1f_0%,#000000_90%)] perspective-[1000px]">
      <style>{`
        @keyframes grid-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
      `}</style>
      <div className="absolute -bottom-[30%] -left-[50%] w-[200%] h-full bg-[size:60px_60px] opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(rgba(155,89,182,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(155,89,182,0.4) 1px, transparent 1px)
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          boxShadow: '0 0 100px rgba(155,89,182, 0.2)',
          maskImage: 'linear-gradient(to top, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 95%)',
          animation: 'grid-scroll 3s linear infinite'
        }}
      />
      
      {/* Decorative Cubes */}
      <Cube top="20%" left="15%" />
      <Cube top="60%" right="20%" delay="-5s" />

      {/* Runes */}
      <div className="absolute top-[10%] left-[5%] text-[10rem] opacity-5 select-none text-white font-title rotate-[-10deg] pointer-events-none">念</div>
      <div className="absolute bottom-[20%] right-[10%] text-[15rem] opacity-5 select-none text-white font-title rotate-[10deg] pointer-events-none">絶</div>
    </div>
  );
};

const Cube: React.FC<{ top?: string; left?: string; right?: string; delay?: string }> = ({ top, left, right, delay }) => {
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  
  const getTransform = (face: string) => {
    switch(face) {
      case 'front': return 'translateZ(20px)';
      case 'back': return 'rotateY(180deg) translateZ(20px)';
      case 'right': return 'rotateY(90deg) translateZ(20px)';
      case 'left': return 'rotateY(-90deg) translateZ(20px)';
      case 'top': return 'rotateX(90deg) translateZ(20px)';
      case 'bottom': return 'rotateX(-90deg) translateZ(20px)';
      default: return '';
    }
  };

  return (
    <div className="absolute w-10 h-10 preserve-3d animate-spin-slow opacity-10" style={{ top, left, right, animationDelay: delay, transformStyle: 'preserve-3d' }}>
      {faces.map(face => (
        <div key={face} className="absolute w-10 h-10 border border-[#9b59b6] bg-[#9b59b6]/10" style={{ transform: getTransform(face) }} />
      ))}
    </div>
  );
};