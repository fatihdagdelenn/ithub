# Changelog

Bu proje [Semantic Versioning](https://semver.org/) kullanır. Format
[Keep a Changelog](https://keepachangelog.com/) temel alınarak hazırlanmıştır.

## [1.1.0] - 2026-08-18

### Eklenenler

- Sistem kartlarında çevrimiçi/çevrimdışı göstergesi: arka planda periyodik olarak (varsayılan
  10 dakikada bir, `HEALTH_CHECK_INTERVAL_MINUTES` ile ayarlanabilir) her sistemin URL'sine hafif
  bir HTTP isteği atılır, sonucuna göre kart ikonunun köşesinde yeşil/kırmızı/gri nokta gösterilir
- Kartları kategori içinde sürükle-bırak ile yeniden sıralama (Admin), tutamaç ikonu ile

## [1.0.0] - 2026-08-13

İlk sürüm.

### Eklenenler

- Kategori bazlı dashboard, arama, etiket filtresi, favoriler
- Sistem ekleme / düzenleme / silme / kopyalama (Admin)
- Kategori ve etiket yönetimi (Admin)
- Kullanıcı yönetimi ve rol bazlı erişim (Admin / User)
- Toplu içe/dışa aktarma (JSON) ve toplu silme
- Dark / Light tema desteği (varsayılan: dark)
- iron-session tabanlı oturum yönetimi, yönetilen sistemlerin kimlik bilgilerini saklamayan mimari
- Docker / docker-compose ile tek komutla kurulum, tamamen çevrimdışı/intranet ortamlarda
  çalışabilecek şekilde tasarlandı
- Dashboard'da uygulama sürümü görünür (Navbar ve giriş ekranı)

[1.1.0]: https://github.com/fatihdagdelenn/ithub/releases/tag/v1.1.0
[1.0.0]: https://github.com/fatihdagdelenn/ithub/releases/tag/v1.0.0
