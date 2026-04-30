# 🚀 AI Training Center - Teknik Dokümantasyon ve Oyun Rehberi

Bu döküman, **AI Training Center** projesinin mimarisini, teknik yapısını ve oynanış mekaniklerini detaylandırmaktadır.

---

## 🏗️ 1. Mimari Yapı (Technical Architecture)

Oyun, **Modüler JavaScript** ve **Nesne Yönelimli Programlama (OOP)** prensipleri üzerine inşa edilmiştir. Grafik motoru olarak **Phaser 3**, arayüz (UI) için ise **Tailwind CSS** kullanılmıştır.

### Ana Bileşenler:
- **`src/main.js` (Orchestrator):** Oyunun ana giriş noktasıdır. `StateManager`, `UIManager` ve `Phaser` motoru arasındaki köprüyü (Bridge Logic) kurar.
- **`src/core/StateManager.js` (Logic & Economy):** Oyunun "beyni"dir. Veri miktarını, saniyede üretilen veriyi (MPS), tıklama gücünü, ısınma mekanizmasını ve kalıcı bonusları yönetir.
- **`src/ui/UIManager.js` (UI Layer):** DOM elementlerini, terminal loglarını, mağaza arayüzünü ve karar modallarını yönetir.
- **`src/scenes/MainScene.js` (Rendering):** Phaser sahnesidir. Arka plan efektlerini, Matrix yağmurunu ve AI Çekirdeğini ekrana çizer.
- **`src/entities/AICore.js` (Visual Entity):** Merkezi etkileşim nesnesidir. Çekirdeğin görsel evrimini ve tıklama efektlerini yönetir.

---

## 🎮 2. Oynanış Mekanikleri (Gameplay)

### Temel Döngü:
1. **Veri Toplama:** Merkezi AI Çekirdeğine tıklayarak veya otomatik yükseltmelerle veri (MB, GB, TB) toplayın.
2. **Yükseltme (Optimization):** Toplanan verilerle CPU, GPU ve Kuantum çekirdeklerini optimize ederek verimliliği artırın.
3. **Isı Yönetimi:** Her tıklama çekirdek ısısını artırır. Eğer ısı %100'e ulaşırsa sistem **OVERHEAT** durumuna geçer ve 5 saniye boyunca veri üretimi durur.

### Neural Ascension (Prestige):
Büyük miktarda veri (1.0 GB+) biriktirdiğinizde, bilincinizi "yükseltebilirsiniz". Bu işlem her şeyi sıfırlar ancak kalıcı bir çarpan (multiplier) sağlar.

### ⚖️ 2.1. Dengeleme (Balancing & Soft Cap):
Oyunun ilerleyen aşamalarında veri üretiminin kontrolden çıkmasını önlemek için iki temel mekanizma eklenmiştir:
- **Soft Cap (Yumuşak Limit):** 1 PB (Petabyte) eşiğinden sonra veri üretimi ve tıklama gücü azalan verimler (diminishing returns) yasasına tabi olur.
- **Dinamik Zorluk:** Toplam veri miktarı arttıkça (özellikle 1 TB sonrası), yükseltme maliyetleri logaritmik olarak daha hızlı artar.

---

## 🌀 3. AI Görsel Evrimi (Visual Evolution)

AI Çekirdeği, toplam veri miktarınıza göre 3 farklı aşamada evrim geçirir:

| Aşama | Eşik (Data) | Görsel Özellikler |
| :--- | :--- | :--- |
| **Stage 1** | < 1000 | Zayıf, titreyen, yarı saydam yeşil bir ışık küresi. |
| **Stage 2** | 1000 - 1M | Merkezde parlak çekirdek, zıt dönen neon halkalar ve siber pikseller. |
| **Stage 3** | > 1M | Sürekli form değiştiren glitch efektli devasa enerji formu (Singularity). |

---

## 🧠 4. Karar ve Etkileşim Sistemi

### Dinamik Terminal:

### AI Karar Modalları:
Belirli veri eşiklerinde (10K, 100K) AI size felsefi veya teknik sorular sorar.
- **Duygusal Seçimler:** Tıklama gücünü (Manual Power) artırır.
- **Matematiksel Seçimler:** Otomatik üretimi (Auto MPS) artırır.

---

## 💾 5. Veri Kayıt Sistemi
Oyun, ilerlemenizi tarayıcının `localStorage` alanına otomatik olarak kaydeder. Ayrıca ayarlar kısmından kayıt dosyanızı dışa aktarabilir (Export) veya içe aktarabilirsiniz (Import).

---

## 📱 6. Mobil Uyumluluk (Mobile Optimization)
Oyun, dikey ve yatay ekranlar için tam duyarlı (responsive) bir yapıya sahiptir:
- **Alt Panel Sistemi:** Mobilde market, arşiv ve ayarlar panelleri ekranın altından yukarı doğru açılan "bottom sheet" formuna dönüşür.
- **Dinamik HUD:** Ekran boyutuna göre metin boyutları ve boşluklar otomatik olarak ayarlanır.
- **Dokunmatik Dostu:** Tüm butonlar ve etkileşim alanları mobil cihazlar için optimize edilmiştir.

---
*DeepMind // Agentic Core v1.0.4*
