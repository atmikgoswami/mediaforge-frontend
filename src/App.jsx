import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import CompressImage from './pages/CompressImage';
import ConvertImage from './pages/ConvertImage';
import ResizeImage from './pages/ResizeImage';
import CompressPDF from './pages/CompressPDF';
import ExtractPDF from './pages/ExtractPDF';
import MergePDF from './pages/MergePDF';
import { Menu, X, ChevronDown, FileText, Images } from 'lucide-react';

// Navigation items with grouping
const navigationItems = [
  {
    category: "Image",
    icon: <Images size={18} />,
    items: [
      { name: "Compress Image", path: "/image/compress" },
      { name: "Convert Image", path: "/image/convert" },
      { name: "Resize Image", path: "/image/resize" }
    ]
  },
  {
    category: "PDF",
    icon: <FileText size={18} />,
    items: [
      { name: "Compress PDF", path: "/pdf/compress" },
      { name: "Extract PDF", path: "/pdf/extract" },
      { name: "Merge PDF", path: "/pdf/merge" }
    ]
  }
];

// A wrapper component to get the current route
const AppContent = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleCategory = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl font-extrabold text-blue-600 tracking-tight">Mediaforge</span>
                </motion.div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-md font-medium transition-colors duration-200">
                Home
              </Link>
              
              {navigationItems.map((category) => (
                <div key={category.category} className="relative group">
                  <button
                    className="text-gray-700 group-hover:text-blue-600 px-3 py-2 text-md font-medium inline-flex items-center transition-colors duration-200"
                    onClick={() => toggleCategory(category.category)}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.category}
                    <ChevronDown size={16} className="ml-1" />
                  </button>
                  
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {category.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-blue-600 transition duration-150 ease-in-out"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white shadow-lg"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  Home
                </Link>
                
                {navigationItems.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        {category.category}
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${expandedCategory === category.category ? 'transform rotate-180' : ''}`} 
                      />
                    </button>
                    {expandedCategory === category.category && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 space-y-1"
                      >
                        {category.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/image/compress" element={<CompressImage />} />
              <Route path="/image/convert" element={<ConvertImage />} />
              <Route path="/image/resize" element={<ResizeImage />} />
              <Route path="/pdf/compress" element={<CompressPDF />} />
              <Route path="/pdf/extract" element={<ExtractPDF />} />
              <Route path="/pdf/merge" element={<MergePDF />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link to="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Privacy Policy</span>
                <span className="text-sm">Privacy Policy</span>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Terms of Service</span>
                <span className="text-sm">Terms of Service</span>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Contact</span>
                <span className="text-sm">Contact</span>
              </Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1 text-center md:text-left">
              <p className="text-sm text-gray-500">© 2025 Mediaforge. All rights reserved.</p>
              <p className="text-xs text-gray-400 mt-1">Crafted with ❤️ to simplify your media tasks.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}