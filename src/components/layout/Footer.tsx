"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Mail, MapPin, ShieldCheck, Trees, Volume2 } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Eksplorasi",
    links: [
      { label: "Beranda Utama", href: "/" },
      { label: "Dunia Hutan 3D & VR", href: "/explore" },
      { label: "Ensiklopedia Spesies", href: "/encyclopedia" },
      { label: "Kuis Penjelajah", href: "/quiz" },
      { label: "Paspor & Lencana", href: "/progress" },
    ],
  },
  {
    title: "Kategori Ekosistem",
    links: [
      { label: "Mamalia Hutan", href: "/encyclopedia?category=Mamalia" },
      { label: "Burung Kanopi", href: "/encyclopedia?category=Burung" },
      { label: "Reptil Sungai", href: "/encyclopedia?category=Reptil" },
      { label: "Amfibi Endemik", href: "/encyclopedia?category=Amfibi" },
      { label: "Flora & Pohon Raksasa", href: "/encyclopedia?category=Tumbuhan" },
    ],
  },
  {
    title: "Materi Populer",
    links: [
      { label: "Empat Lapisan Hutan", href: "/#keanekaragaman-hayati" },
      { label: "Pohon Kapuk Raksasa", href: "/encyclopedia/kapok-tree" },
      { label: "Predator Jaguar", href: "/encyclopedia/jaguar" },
      { label: "Burung Tukan Tropis", href: "/encyclopedia/toucan" },
      { label: "Teratai Raksasa Sungai", href: "/encyclopedia/amazon-water-lily" },
    ],
  },
  {
    title: "Panduan Belajar",
    links: [
      { label: "Cara Bermain & Belajar", href: "/#cara-belajar" },
      { label: "Kontrol Navigasi & VR", href: "/explore" },
      { label: "Uji Pemahaman Anak", href: "/quiz" },
      { label: "Capaian & Lencana", href: "/progress" },
      { label: "Katalog 13 Model 3D", href: "/encyclopedia" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/explore")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-[#f8faf9] text-slate-600">
      <div className="mx-auto w-full max-w-[1640px] px-5 pt-14 pb-8 sm:px-8 lg:px-12 lg:pt-16">
        {/* Main Corporate Multi-Column Sitemap */}
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Identity & EdTech Standards */}
          <div className="sm:col-span-2 lg:col-span-4 lg:pr-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Trees className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <span className="block font-display text-lg font-bold tracking-tight text-slate-900">
                  AMAZON <span className="text-emerald-600">EDU</span>
                </span>
                <span className="block text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                  Rainforest 3D Interactive
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Platform media pembelajaran interaktif 3D dan Virtual Reality
              untuk mengenalkan keanekaragaman hayati ekosistem Hutan Hujan
              Amazon kepada anak, siswa, dan pendidik di Indonesia.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Ramah Anak &amp; Bebas Iklan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                Audio Bahasa Indonesia
              </span>
            </div>

            <div className="mt-5 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>edukasi@amazonedu.id</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Divisi Media Pembelajaran Sains &amp; Lingkungan, Jakarta</span>
              </p>
            </div>
          </div>

          {/* Structured Navigation Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="font-display text-sm font-bold tracking-tight text-slate-900">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-600 transition-colors hover:text-emerald-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Legal, Policy & Localization Bar */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200/90 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} Amazon Edu Interactive. Seluruh hak
            cipta dilindungi undang-undang.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/#cara-belajar" className="hover:text-slate-800 transition-colors">
              Panduan Pendidik
            </Link>
            <Link href="/progress" className="hover:text-slate-800 transition-colors">
              Privasi &amp; Data Belajar
            </Link>
            <Link href="/explore" className="hover:text-slate-800 transition-colors">
              Dukungan Perangkat VR
            </Link>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              Bahasa Indonesia (ID)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
