import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-transparent rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="Sm@rtz Global Logo" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Sm@rtz Global</h3>
                <p className="text-sm text-gray-400">Enterprise</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Your one-stop digital solutions provider for computer accessories, books, and professional business
              services.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products/computers" className="text-gray-400 hover:text-primary text-sm">
                  Computer Accessories
                </Link>
              </li>
              <li>
                <Link href="/products/books" className="text-gray-400 hover:text-primary text-sm">
                  Books & Literature
                </Link>
              </li>
              <li>
                <Link href="/business-center" className="text-gray-400 hover:text-primary text-sm">
                  Business Center
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-primary text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Our Services</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">Document Printing</li>
              <li className="text-gray-400 text-sm">Project Analysis</li>
              <li className="text-gray-400 text-sm">Assignment Editing</li>
              <li className="text-gray-400 text-sm">Online Shopping</li>
              <li className="text-gray-400 text-sm">Fast Delivery</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-gray-400 text-sm">
                  Shop 4 & 5, Behind Faculty of CIS,
                  <br />
                  University of Ilorin PS, Ilorin, Nigeria
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-gray-400 text-sm">+234 815 664 5378</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-400 text-sm">printatsmartz@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Sm@rtz Global Enterprise. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-primary text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-primary text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-500 text-xs">
              CEO: Eneji Daniel Moses | Proudly serving bringing solutions to students and the community
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
