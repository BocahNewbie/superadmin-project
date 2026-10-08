const scriptURL = 'https://script.google.com/macros/s/AKfycbxx8fjwd0fjAsnrYkEH0aMCRGul5TVc8lp5HoeA9Jt8yq1zXBfp5ySr1eb7GvyI6chb/exec'; 
let globalDataCache = [];

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
    
    // Urutkan berdasarkan Tanggal terlebih dahulu, lalu Jam terkecil (paling awal)
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Belum ada data peserta.</td></tr>';
        return;
    }

    dataArray.forEach((item, index) => {
        let tglFormatted = formatTanggal(item.tanggal);
        let statusBadge = item.keterangan === 'Lunas' ? '<span style="color: #34d399; font-weight: bold;">Lunas ✅</span>' : '<span style="color: #f87171; font-weight: bold;">Belum ⏳</span>';
        
        html += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td><b>${item.nama || '-'}</b><br><small style="color:#94a3b8;">${item.telepon || ''}</small></td>
                <td>${tglFormatted}</td>
                <td>${item.jam || '-'}</td>
                <td>${statusBadge}</td>
                <td style="text-align: center; display: flex; gap: 5px; justify-content: center;">
                    <button type="button" onclick='openEditModal(${JSON.stringify(item)})' style="background:#0d9488; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px;">✏️ Edit</button>
                    <button type="button" onclick='confirmDelete("${item.telepon}", "${item.nama}")' style="background:#dc2626; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ Hapus</button>
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
        let telp = (item.telepon || '').toLowerCase();
        return nama.includes(keyword) || telp.includes(keyword);
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
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        alert('🎉 Perubahan berhasil disimpan!');
        closeEditModal();
        setTimeout(loadAdminData, 1500);
    })
    .catch(err => alert('Terjadi kesalahan: ' + err));
}

// Fitur Verifikasi Hapus 2x
function confirmDelete(telepon, nama) {
    // Verifikasi 1 (Alert Pertama)
    let step1 = confirm(`⚠️ PERINGATAN!\n\nAnda akan menghapus data peserta atas nama: "${nama}".\nLanjutkan proses penghapusan?`);
    if (step1) {
        // Verifikasi 2 (Alert Konfirmasi Akhir)
        let step2 = confirm(`🚨 KONFIRMASI AKHIR!\n\nData yang dihapus tidak dapat dikembalikan lagi. Yakin ingin menghapus "${nama}" secara permanen?`);
        if (step2) {
            executeDelete(telepon);
        }
    }
}

function executeDelete(telepon) {
    const formData = {
        action: "hapus",
        telepon: telepon
    };

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        alert('🗑️ Data berhasil dihapus dari sistem.');
        setTimeout(loadAdminData, 1500);
    })
    .catch(err => alert('Terjadi kesalahan saat menghapus: ' + err));
}

function downloadExcel() {
    if (globalDataCache.length === 0) {
        alert("Tidak ada data!");
        return;
    }
    let tableHTML = `<table border="1"><thead><tr style="background-color: #0d9488; color: white;"><th>No</th><th>Nama</th><th>Alamat</th><th>No WA</th><th>Tanggal</th><th>Jam</th><th>Status</th></tr></thead><tbody>`;
    globalDataCache.forEach((item, index) => {
        tableHTML += `<tr><td>${index+1}</td><td>${item.nama||''}</td><td>${item.alamat||''}</td><td>'${item.telepon||''}</td><td>${formatTanggal(item.tanggal)||''}</td><td>${item.jam||''}</td><td>${item.keterangan||''}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    let blob = new Blob(['\ufeff' + tableHTML], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'Data_Peserta_Admin.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
