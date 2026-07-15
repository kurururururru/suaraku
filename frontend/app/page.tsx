'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-primary overflow-x-hidden">
      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-50 bg-surface-container-lowest dark:bg-surface-dim shadow-sm">
        <nav className="flex justify-between items-center h-20 px-container-padding max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-display" style={{ fontVariationSettings: "'FILL' 1" }}>ballot</span>
            <span className="font-display text-h2 text-primary dark:text-inverse-primary">SuaraKu</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-body text-body text-primary border-b-2 border-primary pb-1 transition-all duration-200" href="#beranda">Beranda</a>
            <a className="font-body text-body text-on-surface-variant hover:text-primary transition-colors" href="#tentang">Tentang</a>
            <a className="font-body text-body text-on-surface-variant hover:text-primary transition-colors" href="#keunggulan">Keunggulan</a>
            <a className="font-body text-body text-on-surface-variant hover:text-primary transition-colors" href="#alur">Alur Pemilihan</a>
            <a className="font-body text-body text-on-surface-variant hover:text-primary transition-colors" href="#faq">FAQ</a>
          </div>
          <Link href="/login" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-body-bold transition-all duration-200 active:scale-[0.98] hover:bg-primary-container shadow-sm inline-block">
            Login
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-container-padding py-section-gap flex flex-col md:flex-row items-center gap-gutter min-h-[80vh]" id="beranda">
          <div className="w-full md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-fixed text-primary rounded-full">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-label text-label uppercase tracking-wider">Secured by Hybrid Cryptography</span>
            </div>
            <h1 className="font-display text-display md:text-[48px] md:leading-tight text-primary">
              Sistem E-Voting Mahasiswa yang Aman, Cepat, dan Transparan
            </h1>
            <p className="font-body text-body text-on-surface-variant max-w-lg">
              Revolusi demokrasi kampus dengan platform pemilihan digital terenkripsi. Menjamin setiap suara dihitung secara akurat tanpa kompromi pada privasi dan keamanan data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-body-bold hover:bg-primary-container active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
                Masuk ke Sistem
                <span className="material-symbols-outlined">login</span>
              </Link>
              <a href="#tentang" className="border-2 border-outline-variant text-primary px-8 py-4 rounded-xl font-body-bold hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Pelajari Sistem
                <span className="material-symbols-outlined">info</span>
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img alt="E-Voting Illustration" className="w-full max-w-[500px] drop-shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6WvL-G847AkIMyok_zRjWa-ZFip23vrOvD3KWQyD7lCSNywN_0jhLIY68AfNFvLmUJuNB7y910rfznx-WKB9XvHOPFGa0oWsQkicITJvhOlwXeKTmniWrur73Ujn61zmCUAWf61Rr7yuAF1lcmQQfHXdutTzbc82PoDgVdByK62uuuYtVB6jEUDnqDmf5NAA2c1EegwxNHKWIZzYnG96QIHfhiC9limvwzRaN6vpvf8z9RwMvBeDO" />
          </div>
        </section>

        {/* About Section */}
        <section className="bg-surface-container-low py-section-gap" id="tentang">
          <div className="max-w-[1280px] mx-auto px-container-padding">
            <div className="bg-surface-container-lowest rounded-[32px] p-8 md:p-16 shadow-sm border border-outline-variant flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/3">
                <div className="w-20 h-20 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-[40px]">history_edu</span>
                </div>
                <h2 className="font-display text-h1 text-primary">Tentang SuaraKu</h2>
              </div>
              <div className="w-full md:w-2/3">
                <p className="font-body text-body text-on-surface-variant leading-relaxed text-lg">
                  SuaraKu adalah platform pemilihan raya mahasiswa (PEMIRA) masa depan yang dikembangkan secara khusus untuk memenuhi standar keamanan institusional. Mengintegrasikan algoritma kriptografi modern, sistem ini memastikan integritas pemilihan dari tahap pendaftaran hingga rekapitulasi akhir. Kami percaya bahwa transparansi adalah kunci dari kepercayaan konstituen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="max-w-[1280px] mx-auto px-container-padding py-section-gap" id="keunggulan">
          <div className="text-center mb-16">
            <h2 className="font-display text-h1 text-primary mb-4">Kenapa Memilih SuaraKu?</h2>
            <p className="font-body text-body text-on-surface-variant max-w-2xl mx-auto">Dirancang untuk skalabilitas dan keamanan tinggi dengan fitur-fitur unggulan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-container text-secondary rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Hybrid Encryption</h3>
              <p className="font-body text-body text-on-surface-variant">Menggabungkan RSA dan AES-256 untuk perlindungan data suara yang tidak dapat ditembus.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-surface-container text-primary rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">draw</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Digital Signature</h3>
              <p className="font-body text-body text-on-surface-variant">Setiap suara memiliki tanda tangan digital unik untuk memverifikasi keaslian pemilih.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-tertiary-fixed text-tertiary-container rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Transparent Election</h3>
              <p className="font-body text-body text-on-surface-variant">Proses audit publik yang memungkinkan verifikasi hasil tanpa melanggar anonimitas pemilih.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-error-container text-error rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Fast Vote Counting</h3>
              <p className="font-body text-body text-on-surface-variant">Hasil perhitungan instan segera setelah periode pemilihan berakhir secara otomatis.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-fixed text-primary rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">shield_with_heart</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Secure Authentication</h3>
              <p className="font-body text-body text-on-surface-variant">Integrasi Single Sign-On (SSO) Kampus dengan validasi identitas multi-faktor.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-variant hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-fixed text-on-secondary-fixed-variant rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-3">Real-time Results</h3>
              <p className="font-body text-body text-on-surface-variant">Monitoring tingkat partisipasi secara langsung selama pemilihan berlangsung.</p>
            </div>
          </div>
        </section>

        {/* Voting Process */}
        <section className="bg-white py-section-gap overflow-hidden relative" id="alur">
          <style dangerouslySetInnerHTML={{__html: `
            .step-line::after {
                content: '';
                position: absolute;
                top: 1.5rem;
                left: 60%;
                right: -40%;
                height: 2px;
                background: #e2dfff;
                z-index: -1;
            }
            @media (max-width: 768px) {
                .step-line::after { display: none; }
            }
          `}} />
          <div className="max-w-[1280px] mx-auto px-container-padding">
            <div className="text-center mb-16">
              <h2 className="font-display text-h1 text-primary mb-4">Cara Memilih</h2>
              <p className="font-body text-body text-on-surface-variant">Proses sederhana untuk memberikan hak suara Anda.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 justify-between relative z-10">
              <div className="flex-1 flex flex-col items-center text-center relative step-line">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary mb-6 shadow-lg">
                  <span className="material-symbols-outlined">login</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface mb-2">Login</h4>
                <p className="font-body text-body text-on-surface-variant">Gunakan kredensial kampus untuk masuk.</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center relative step-line">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary mb-6 shadow-lg">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface mb-2">Pilih Kandidat</h4>
                <p className="font-body text-body text-on-surface-variant">Pilih calon pemimpin pilihan Anda.</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center relative step-line">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary mb-6 shadow-lg">
                  <span className="material-symbols-outlined">send_and_archive</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface mb-2">Kirim Suara Aman</h4>
                <p className="font-body text-body text-on-surface-variant">Suara dienkripsi sebelum dikirim ke server.</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary mb-6 shadow-lg">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface mb-2">Lihat Hasil</h4>
                <p className="font-body text-body text-on-surface-variant">Pantau hasil pemilihan setelah ditutup.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-surface-container-low py-section-gap">
          <div className="max-w-[1280px] mx-auto px-container-padding">
            <h2 className="font-display text-h1 text-primary mb-12 text-center">Lapisan Keamanan Institusional</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
                <span className="material-symbols-outlined text-primary mb-4">vpn_key</span>
                <h4 className="font-body-bold text-on-surface mb-2">JWT</h4>
                <p className="text-xs text-on-surface-variant">Otentikasi token aman untuk setiap sesi pengguna.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
                <span className="material-symbols-outlined text-primary mb-4">enhanced_encryption</span>
                <h4 className="font-body-bold text-on-surface mb-2">RSA</h4>
                <p className="text-xs text-on-surface-variant">Enkripsi asimetris untuk pertukaran kunci aman.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
                <span className="material-symbols-outlined text-primary mb-4">lock_reset</span>
                <h4 className="font-body-bold text-on-surface mb-2">AES-256</h4>
                <p className="text-xs text-on-surface-variant">Standar enkripsi data tingkat militer paling kuat.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
                <span className="material-symbols-outlined text-primary mb-4">fingerprint</span>
                <h4 className="font-body-bold text-on-surface mb-2">HMAC</h4>
                <p className="text-xs text-on-surface-variant">Verifikasi integritas pesan yang masuk ke sistem.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
                <span className="material-symbols-outlined text-primary mb-4">verified_user</span>
                <h4 className="font-body-bold text-on-surface mb-2">Digital Signs</h4>
                <p className="text-xs text-on-surface-variant">Validasi identitas digital pemilih secara mutlak.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="max-w-[1280px] mx-auto px-container-padding py-section-gap">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-surface-container rounded-[32px] border border-primary-fixed">
              <span className="font-display text-[42px] block text-primary mb-1">12K+</span>
              <span className="font-label text-on-surface-variant uppercase">Registered Voters</span>
            </div>
            <div className="text-center p-8 bg-surface-container rounded-[32px] border border-primary-fixed">
              <span className="font-display text-[42px] block text-primary mb-1">45</span>
              <span className="font-label text-on-surface-variant uppercase">Candidates</span>
            </div>
            <div className="text-center p-8 bg-surface-container rounded-[32px] border border-primary-fixed">
              <span className="font-display text-[42px] block text-primary mb-1">28</span>
              <span className="font-label text-on-surface-variant uppercase">Elections Held</span>
            </div>
            <div className="text-center p-8 bg-surface-container rounded-[32px] border border-primary-fixed">
              <span className="font-display text-[42px] block text-primary mb-1">94%</span>
              <span className="font-label text-on-surface-variant uppercase">Participation</span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-[800px] mx-auto px-container-padding py-section-gap" id="faq">
          <h2 className="font-display text-h1 text-primary mb-12 text-center">Pertanyaan Umum</h2>
          <div className="space-y-4">
            <details className="group bg-white rounded-2xl border border-outline-variant p-6 transition-all duration-300 open:shadow-md cursor-pointer">
              <summary className="flex justify-between items-center list-none font-h3 text-h3 text-on-surface outline-none">
                Apakah pilihan saya anonim?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="mt-4 font-body text-body text-on-surface-variant leading-relaxed">
                Ya, sistem kami menggunakan teknologi zero-knowledge proof di mana identitas Anda diverifikasi untuk masuk, namun pilihan suara Anda dienkripsi sedemikian rupa sehingga tidak dapat dilacak kembali ke identitas Anda.
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-outline-variant p-6 transition-all duration-300 open:shadow-md cursor-pointer">
              <summary className="flex justify-between items-center list-none font-h3 text-h3 text-on-surface outline-none">
                Bagaimana mencegah pemilihan ganda?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="mt-4 font-body text-body text-on-surface-variant leading-relaxed">
                Setiap pemilih yang terdaftar hanya diberikan satu token akses unik yang divalidasi oleh database pusat. Begitu suara dikirimkan, token tersebut akan ditandai sebagai 'digunakan' secara permanen.
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-outline-variant p-6 transition-all duration-300 open:shadow-md cursor-pointer">
              <summary className="flex justify-between items-center list-none font-h3 text-h3 text-on-surface outline-none">
                Apa perlindungan terhadap serangan cyber?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="mt-4 font-body text-body text-on-surface-variant leading-relaxed">
                Kami menggunakan proteksi DDoS tingkat lanjut, Web Application Firewall (WAF), dan enkripsi end-to-end. Data cadangan juga disimpan dalam cold storage terenkripsi secara berkala.
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-outline-variant p-6 transition-all duration-300 open:shadow-md cursor-pointer">
              <summary className="flex justify-between items-center list-none font-h3 text-h3 text-on-surface outline-none">
                Kapan hasil pemilihan dapat dilihat?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="mt-4 font-body text-body text-on-surface-variant leading-relaxed">
                Hasil pemilihan akan dipublikasikan secara otomatis oleh sistem tepat satu jam setelah waktu pemilihan resmi ditutup untuk memberikan waktu sinkronisasi data global yang aman.
              </div>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[1280px] mx-auto px-container-padding py-section-gap mb-24">
          <div className="bg-primary-container rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <h2 className="font-display text-[40px] leading-tight text-white mb-6 relative z-10">Sudah Siap Berpartisipasi?</h2>
            <p className="font-body text-lg text-primary-fixed mb-10 max-w-xl mx-auto relative z-10">Gunakan hak suara Anda untuk menentukan masa depan kampus yang lebih baik melalui sistem yang adil dan terbuka.</p>
            <Link href="/login" className="bg-white text-primary px-10 py-5 rounded-2xl font-body-bold text-lg hover:bg-surface-container-low transition-all shadow-xl relative z-10 active:scale-[0.98] inline-block">
              Login ke SuaraKu Sekarang
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-highest dark:bg-inverse-surface py-section-gap border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-container-padding flex flex-col md:flex-row justify-between gap-gutter">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-h1" style={{ fontVariationSettings: "'FILL' 1" }}>ballot</span>
              <span className="font-display text-h3 text-on-surface dark:text-inverse-on-surface">SuaraKu</span>
            </div>
            <p className="font-body text-body text-on-surface-variant">Sistem pemungutan suara elektronik tingkat institusi yang mengedepankan keamanan kriptografi dan integritas data pemilihan.</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white hover:bg-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
              <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white hover:bg-primary transition-colors" href="#"><span className="material-symbols-outlined">mail</span></a>
              <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white hover:bg-primary transition-colors" href="#"><span className="material-symbols-outlined">description</span></a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12 mt-8 md:mt-0">
            <div className="space-y-4">
              <h5 className="font-body-bold text-on-surface uppercase tracking-wider text-xs">Pusat Bantuan</h5>
              <ul className="space-y-2">
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Kebijakan Privasi</a></li>
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Syarat &amp; Ketentuan</a></li>
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Panduan Pemilih</a></li>
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Kontak Kami</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-body-bold text-on-surface uppercase tracking-wider text-xs">Akses Cepat</h5>
              <ul className="space-y-2">
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#tentang">Tentang Sistem</a></li>
                <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#faq">FAQ</a></li>
                <li><Link className="text-primary hover:text-primary-fixed-variant transition-colors text-sm font-body-bold" href="/admin/login">Login Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-container-padding mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm text-on-surface-variant">© 2024 SuaraKu University E-Voting. Secured by Institutional Grade Encryption.</p>
          <p className="font-body text-sm text-on-surface-variant italic">Powered by SuaraKu Dev Team</p>
        </div>
      </footer>
    </div>
  );
}
