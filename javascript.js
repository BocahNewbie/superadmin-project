const scriptURL = 'https://script.google.com/macros/s/AKfycbznHVv1XuVY8QeBz-dDC_DqGVsgiUZAiQcaBbty621hVae622Vuui_eaUjCMUZbXXvC/exec'; 
let globalDataCache = [];
let targetDeleteTelepon = null; // Menyimpan nomor untuk konfirmasi hapus

document.addEventListener("DOMContentLoaded", function() {
    loadAdminData();
});

function loadAdminData() {
    const oldScript = document.getElementById('jsonpAdminScript');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'jsonpAdminScript';
    script.src = scriptURL + "?callback=handleAdminData&t=" + new Date().getTime();
    document.body.appendChild(script);
}

function formatTanggal(tglStr) {
    if (!tglStr) return '-';
    let str = tglStr.toString().trim().replace(/^['"]/, '');
    if (!str.includes('T') && !str.includes('-')) return str;
    let cleanStr = str.split('T')[0];
    let parts = cleanStr.split('-');
    if (parts.length === 3) {
        let tahun = parts[0];
        let bulanIndex = parseInt(parts[1], 10) - 1;
        let hari = parseInt(parts[2], 10);
        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        if (namaBulan[bulanIndex]) return `${hari} ${namaBulan[bulanIndex]} ${tahun}`;
    }
    return tglStr;
}

function parseTanggalCustom(tglStr) {
    if (!tglStr) return new Date(8640000000000);
    let formatted = formatTanggal(tglStr);
    let p2 = formatted.split(' ');
    if (p2.length === 3) {
        let hari = parseInt(p2[0], 10);
        let bulanNama = p2[1];
        let tahun = parseInt(p2[2], 10);
        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        let bulanIndex = namaBulan.indexOf(bulanNama);
        if (bulanIndex !== -1) return new Date(tahun, bulanIndex, hari);
    }
    return new Date(tglStr);
}

function parseJamToMinutes(jamStr) {
    if (!jamStr) return 9999;
    let clean = jamStr.toString().toLowerCase().replace(/jam/g, '').trim();
    clean = clean.replace('.', ':').replace(',', ':');
    let parts = clean.split(':');
    if (parts.length === 2) {
        let h = parseInt(parts[0], 10) || 0;
        let m = parseInt(parts[1], 10) || 0;
        return (h * 60) + m;
    }
    let singleNum = parseInt(clean, 10);
    if (!isNaN(singleNum)) return singleNum * 60;
    return 9999;
}

window.handleAdminData = function(data) {
    if (!Array.isArray(data)) return;
    
    // Urutkan berdasarkan Tanggal lalu Jam terkecil
    data.sort((a, b) => {
        let dateA = parseTanggalCustom(a.tanggal);
        let dateB = parseTanggalCustom(b.tanggal);
        if (dateA - dateB !== 0) return dateA - dateB;
        return parseJamToMinutes(a.jam) - parseJamToMinutes(b.jam);
    });

    globalDataCache = data;
    renderAdminTable(globalDataCache);
};

function renderAdminTable(dataArray) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    let html = "";

    if (dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px; color: #99f6e4;">Belum ada data peserta. 📭</td></tr>';
        return;
    }

    dataArray.forEach((item, index) => {
        let tglFormatted = formatTanggal(item.tanggal);
        let statusBadge = item.keterangan === 'Lunas' 
            ? '<span style="background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 4px 10px; border-radius: 6px; font-weight: 600; border: 1px solid rgba(52,211,153,0.3);">Lunas ✅</span>' 
            : '<span style="background: rgba(248, 113, 113, 0.2); color: #f87171; padding: 4px 10px; border-radius: 6px; font-weight: 600; border: 1px solid rgba(248,113,113,0.3);">Belum ⏳</span>';
        
        html += `
            <tr>
                <td style="text-align: center; color: #5eead4; font-weight: 600;">${index + 1}</td>
                <td style="color: #94a3b8; font-size: 12px;">${item.timestamp || '-'}</td>
                <td style="font-weight: 700; color: #ffffff;">${item.nama || '-'}</td>
                <td style="color: #ccfbef;">${item.alamat || '-'}</td>
                <td style="color: #99f6e4;">${item.telepon || '-'}</td>
                <td style="color: #5eead4; font-weight: 600;">${tglFormatted}</td>
                <td style="font-weight: 600; color: #ffffff;">${item.jam || '-'}</td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <button type="button" onclick='openEditModal(${JSON.stringify(item)})' style="background:#0284c7; padding:6px 10px; border-radius:6px; font-size:11px; margin-right:4px;">✏️ Edit</button>
                    <button type="button" onclick='promptDelete("${item.telepon}", "${item.nama}")' style="background:#dc2626; padding:6px 10px; border-radius:6px; font-size:11px;">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function filterAdminTable() {
    let keyword = document.getElementById('adminSearch').value.toLowerCase();
    let filtered = globalDataCache.filter(item => {
        let nama = (item.nama || '').toLowerCase();
        let alamat = (item.alamat || '').toLowerCase();
        let telp = (item.telepon || '').toLowerCase();
        return nama.includes(keyword) || alamat.includes(keyword) || telp.includes(keyword);
    });
    renderAdminTable(filtered);
}

function openEditModal(item) {
    document.getElementById('editOriginalTelp').value = item.telepon;
    document.getElementById('editNama').value = item.nama || '';
    document.getElementById('editTanggal').value = formatTanggal(item.tanggal) || '';
    document.getElementById('editJam').value = item.jam || '';
    document.getElementById('editKeterangan').value = item.keterangan || 'Belum';
    
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function saveEditData(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    let originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = "⏳ Menyimpan...";

    const formData = {
        action: "edit",
        telepon: document.getElementById('editOriginalTelp').value,
        nama: document.getElementById('editNama').value.toUpperCase(),
        tanggal: document.getElementById('editTanggal').value,
        jam: document.getElementById('editJam').value,
        keterangan: document.getElementById('editKeterangan').value
    };

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        closeEditModal();
        showPopup("🎉 Berhasil!", "Data peserta berhasil diperbarui di sistem.", "✨");
        loadAdminData(); // Refresh data instan
    })
    .catch(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        closeEditModal();
        showPopup("🎉 Berhasil!", "Perubahan data telah dikirim.", "✨");
        loadAdminData();
    });
}

// Konfirmasi Hapus Interaktif 2 Langkah (Modern Modal)
function promptDelete(telepon, nama) {
    targetDeleteTelepon = telepon;
    showConfirmModal(
        "⚠️ Konfirmasi Hapus", 
        `Apakah Anda yakin ingin menghapus data peserta atas nama "${nama}"?`, 
        "🗑️", 
        () => {
            closeConfirmModal();
            // Langkah Verifikasi ke-2
            setTimeout(() => {
                showConfirmModal(
                    "🚨 Konfirmasi Akhir", 
                    `Data "${nama}" akan dihapus secara permanen dari sistem dan spreadsheet. Lanjutkan?`, 
                    "⚠️", 
                    () => {
                        closeConfirmModal();
                        executeDelete(targetDeleteTelepon);
                    }
                );
            }, 300);
        }
    );
}

function executeDelete(telepon) {
    const formData = {
        action: "hapus",
        telepon: telepon
    };

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        showPopup("🗑️ Terhapus!", "Data peserta berhasil dihapus secara permanen.", "🚀");
        loadAdminData();
    })
    .catch(() => {
        showPopup("🗑️ Terhapus!", "Permintaan hapus telah dikirim.", "🚀");
        loadAdminData();
    });
}

// Pengelolaan Modal Pop-up Modern Interaktif
function showPopup(title, desc, icon) {
    document.getElementById('modalTitlePop').innerText = title;
    document.getElementById('modalDescPop').innerText = desc;
    document.getElementById('modalIconPop').innerText = icon;
    document.getElementById('popupModal').style.display = 'flex';
}

function closePopupModal() {
    document.getElementById('popupModal').style.display = 'none';
}

function showConfirmModal(title, desc, icon, onConfirmCallback) {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmDesc').innerText = desc;
    document.getElementById('confirmIcon').innerText = icon;
    
    let confirmBtn = document.getElementById('confirmYesBtn');
    let newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.addEventListener('click', onConfirmCallback);
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function downloadExcel() {
    if (globalDataCache.length === 0) {
        alert("Tidak ada data untuk didownload!");
        return;
    }
    let tableHTML = `<table border="1"><thead><tr style="background-color: #0d9488; color: white;"><th>No</th><th>Timestamp</th><th>Nama Lengkap</th><th>Alamat</th><th>No WhatsApp</th><th>Tanggal Treatment</th><th>Jam Treatment</th><th>Keterangan Pembayaran</th></tr></thead><tbody>`;
    globalDataCache.forEach((item, index) => {
        tableHTML += `<tr><td>${index+1}</td><td>${item.timestamp||''}</td><td>${item.nama||''}</td><td>${item.alamat||''}</td><td>'${item.telepon||''}</td><td>${formatTanggal(item.tanggal)||''}</td><td>${item.jam||''}</td><td>${item.keterangan||''}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    let blob = new Blob(['\ufeff' + tableHTML], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'Laporan_Pendaftaran_Treatment.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
