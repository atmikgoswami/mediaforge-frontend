import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LockIcon from '../assets/lock.svg';
import ZapIcon from '../assets/zap.svg';
import GithubIcon from '../assets/github.svg';
import {
  FileDown,
  FilePlus,
  ImagePlus,
  FileText,
  SplitSquareHorizontal,
  ArrowDownToLine,
  ArrowUpToLine,
  Images,
  Combine,
  FileOutput,
  Scissors,
} from "lucide-react";

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const functionalities = [
    {
      id: "image-compress",
      title: "Image Compress",
      description: "Reduce image file size while maintaining quality",
      icon: <ArrowDownToLine className="text-green-600" size={24} />,
      category: "image",
      color: "bg-green-100 border-green-300",
      iconBg: "bg-green-200",
      path: "/image/compress",
    },
    {
      id: "image-convert",
      title: "Image Convert",
      description: "Convert between image formats like JPG, PNG, WebP",
      icon: <Images className="text-blue-600" size={24} />,
      category: "image",
      color: "bg-blue-100 border-blue-300",
      iconBg: "bg-blue-200",
      path: "/image/convert",
    },
    {
      id: "image-resize",
      title: "Image Resize",
      description: "Change dimensions of images while preserving quality",
      icon: <ImagePlus className="text-violet-600" size={24} />,
      category: "image",
      color: "bg-violet-100 border-violet-300",
      iconBg: "bg-violet-200",
      path: "/image/resize",
    },
    {
      id: "pdf-compress",
      title: "Compress PDF",
      description: "Reduce file size while optimizing for maximal PDF quality",
      icon: <ArrowDownToLine className="text-orange-600" size={24} />,
      category: "pdf",
      color: "bg-orange-100 border-orange-300",
      iconBg: "bg-orange-200",
      path: "/pdf/compress",
    },
    {
      id: "pdf-extract",
      title: "Extract PDF",
      description: "Extract specific pages or content from PDF documents",
      icon: <Scissors className="text-red-600" size={24} />,
      category: "pdf",
      color: "bg-red-100 border-red-300",
      iconBg: "bg-red-200",
      path: "/pdf/extract",
    },
    {
      id: "pdf-merge",
      title: "Merge PDF",
      description:
        "Combine PDFs in the order you want with the easiest PDF merger",
      icon: <Combine className="text-red-600" size={24} />,
      category: "pdf",
      color: "bg-red-100 border-red-300",
      iconBg: "bg-red-200",
      path: "/pdf/merge",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "image", label: "Image" },
    { id: "pdf", label: "PDF" },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFunctionalities = functionalities.filter(
    (func) => activeCategory === "all" || func.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Mediaforge
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Professional tools for all your file manipulation needs
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${
                  category.id === "all"
                    ? "rounded-l-md"
                    : category.id === "pdf"
                    ? "rounded-r-md"
                    : ""
                } border border-gray-300`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
        >
          {filteredFunctionalities.map((func) => (
            <Link to={func.path}>
              <motion.div
                key={func.id}
                variants={item}
                className={`relative overflow-hidden rounded-lg border ${func.color} p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer`}
                onMouseEnter={() => setHoveredCard(func.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${func.iconBg}`}
                  >
                    {func.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {func.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {func.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        <div className="mt-24 py-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Mediaforge: Your one stop solution to all your media needs
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Explore the wide range of powerful tools designed to help you
              manage, edit, and convert your files with ease. Our secure
              platform ensures your data remains protected while providing
              professional-grade functionality.
            </motion.p>

            <motion.div
              className="mt-12 flex justify-center space-x-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <div className="flex flex-col items-center">
                <img
                  src={GithubIcon}
                  alt="Open Source"
                  className="h-10 hover:scale-105 transition-transform duration-300"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Open Source on GitHub
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={LockIcon}
                  alt="Secure"
                  className="h-10 hover:scale-105 transition-transform duration-300"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Privacy-First & Secure
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={ZapIcon}
                  alt="Fast"
                  className="h-10 hover:scale-105 transition-transform duration-300"
                />
                <p className="mt-2 text-sm text-gray-500">Fast & Lightweight</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
