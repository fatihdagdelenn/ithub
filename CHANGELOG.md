# Changelog

Bu proje [Semantic Versioning](https://semver.org/) kullanır. Format
[Keep a Changelog](https://keepachangelog.com/) temel alınarak hazırlanmıştır.

## [1.2.0] - 2026-10-01

### Eklenenler

- Grup bazlı erişim yönetimi: kullanıcılar yalnızca üye oldukları grupların kategorilerini
  görür; admin her şeyi görür. "Tüm kategoriler" seçeneği sonradan eklenen kategorileri de
  kapsar. Filtre sunucu tarafında uygulanır (sistemler, kategoriler, etiketler, favoriler)
- Grup ve Erişim Yönetimi ekranı (`/admin/groups`): grup ekleme/düzenleme/silme, kategori ve
  üye seçimi
- Kullanıcı formunda grup seçimi ve erişim özeti; erişimi olmayan kullanıcılar için uyarı
- Erişimi olmayan kullanıcının panelinde "Size henüz erişim tanımlanmadı" mesajı
- Dışa/içe aktarmaya gruplar eklendi (format v2); eski format içe aktarılmaya devam eder

### Değişenler

- Favoriler artık kişisel: her kullanıcı kendi favorilerini tutar. Yükseltmede mevcut ortak
  favoriler tüm kullanıcılara kopyalanır
- Kullanıcının rolü ve varlığı her istekte veritabanından doğrulanır: silinen kullanıcı ya da
  rolü değişen kullanıcıda değişiklik anında geçerli olur (önceden 7 günlük oturum süresince
  eski yetkiyle devam ediliyordu)
- Yükseltmede "Herkes" grubu oluşturulur ve mevcut kullanıcılar bu gruba eklenir; kimsenin
  gördüğü değişmez

### Güvenlik

- Tüm `/api/admin/*` uçları sunucu tarafında admin kontrolü yapar (önceden yalnızca
  middleware'deki çerez kontrolüne dayanıyordu); yetkisiz isteklere 500 yerine 401/403 döner
- Demo kullanıcı yalnızca ilk kurulumda oluşturulur; silinen demo hesabı container yeniden
  başlatıldığında bilinen parolasıyla geri gelmez

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

[1.2.0]: https://github.com/fatihdagdelenn/ithub/releases/tag/v1.2.0
[1.1.0]: https://github.com/fatihdagdelenn/ithub/releases/tag/v1.1.0
[1.0.0]: https://github.com/fatihdagdelenn/ithub/releases/tag/v1.0.0
