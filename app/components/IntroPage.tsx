import { useState } from 'react';

const IntroPage = ({ telegramId }: { telegramId: number }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Pi Trader Official",
      description: "Your trusted platform for Pi coin trading",
      color: "bg-blue-100"
    },
    {
      title: "Safe & Secure",
      description: "Trade with confidence using our secure platform",
      color: "bg-purple-100"
    },
    {
      title: "Real-time Updates",
      description: "Get the latest Pi coin prices instantly",
      color: "bg-green-100"
    },
    {
      title: "Start Trading",
      description: "Ready to begin your Pi trading journey?",
      color: "bg-yellow-100"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await fetch('/api/updateIntroSeen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId }),
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Error updating intro seen status:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-black">
      <div className={`w-full max-w-md aspect-[3/4] rounded-2xl ${slides[currentSlide].color} transition-all duration-500 mb-8 flex flex-col items-center justify-center p-6 text-center`}>
        <h2 className="text-2xl font-bold mb-4 text-black">{slides[currentSlide].title}</h2>
        <p className="text-gray-700">{slides[currentSlide].description}</p>
      </div>

      <div className="flex justify-center space-x-2 mb-8">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-blue-500 w-4' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between w-full max-w-md">
        <button
          onClick={handlePrevious}
          className={`px-6 py-2 rounded-lg ${
            currentSlide === 0 ? 'invisible' : 'bg-gray-200 text-black'
          }`}
        >
          Previous
        </button>
        
        {currentSlide === slides.length - 1 ? (
          <button
            onClick={handleFinish}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white"
          >
            Get Started
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default IntroPage;
