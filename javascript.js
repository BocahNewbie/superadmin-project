const scriptURL = 'https://script.google.com/macros/s/AKfycbxx8fjwd0fjAsnrYkEH0aMCRGul5TVc8lp5HoeA9Jt8yq1zXBfp5ySr1eb7GvyI6chb/exec';
const MAX_KUOTA = 13;
let globalDataCache = [];

document.addEventListener("DOMContentLoaded", function() {
    loadDataKuota();
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('popupModal').style.display = 'none';
        });
    }

    const inputNama = document.getElementById('nama');
    const inputAlamat = document.getElementById('alamat');
    if (inputNama) inputNama.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
    if (inputAlamat) inputAlamat.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
});

function loadDataKuota() {
    const oldScript = document.getElementById('jsonpScript');
    if (oldScript) {
        oldScript.remove();
    }
    
    const script = document.createElement('script');
    script.id = 'jsonpScript';
    script.src = scriptURL + "?callback=handleKuotaData&t=" + new Date().getTime();
    document.body.appendChild(script);
}

function formatTanggal(tglStr) {
    if (!tglStr) return '-';
    let str = tglStr.toString().trim().replace(/^['"]/, '');
    if (!str.includes('T') && !str.includes('-')) {
        return str;
    }
    let cleanStr = str.split('T')[0];
    let parts = cleanStr.split('-');
    if (parts.length === 3) {
        let tahun = parts[0];
        let bulanIndex = parseInt(parts[1], 10) - 1;
        let hari = parseInt(parts[2], 10);
        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        if (namaBulan[bulanIndex]) {
            return `${hari} ${namaBulan[bulanIndex]} ${tahun}`;
        }
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
        if (bulanIndex !== -1) {
            return new Date(tahun, bulanIndex, hari);
        }
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
    if (!isNaN(singleNum)) {
        return singleNum * 60;
    }
    return 9999;
}

window.handleKuotaData = function(data) {
    if (!Array.isArray(data)) return;
    globalDataCache = data;

    const selectTanggalForm = document.getElementById('tanggal');
    const wrapperGroup = document.getElementById('groupedTableContainer');
    
    const countMap = {};
    const groupedData = {};

    data.forEach((row) => {
        let rawTgl = row.tanggal ? row.tanggal.toString().trim() : "";
        let formattedTgl = formatTanggal(rawTgl);

        if (formattedTgl && formattedTgl !== '-') {
            countMap[formattedTgl] = (countMap[formattedTgl] || 0) + 1;
            
            if (!groupedData[formattedTgl]) {
                groupedData[formattedTgl] = [];
            }
            groupedData[formattedTgl].push(row);
        }
    });

    let availableDates = [];
    if (selectTanggalForm) {
        selectTanggalForm.querySelectorAll('option').forEach(opt => {
            if (opt.value) availableDates.push(opt.value);
        });
    }

    availableDates.sort((a, b) => parseTanggalCustom(a) - parseTanggalCustom(b));

    let htmlGroups = "";
    
    if (availableDates.length === 0 && Object.keys(groupedData).length === 0) {
        htmlGroups = `<p style="text-align: center; color: #99f6e4; padding: 15px;">Belum ada peserta terdaftar. 📭</p>`;
    } else {
        availableDates.forEach(tgl => {
            let pesertaList = groupedData[tgl] || [];
            
            pesertaList.sort((a, b) => parseJamToMinutes(a.jam) - parseJamToMinutes(b.jam));

            let jumlahPendaftar = countMap[tgl] || 0;
            let statusBadge = jumlahPendaftar >= MAX_KUOTA ? `<span style="color: #f87171;">(Penuh 13/13 🚫)</span>` : `<span style="color: #5eead4;">(${jumlahPendaftar}/${MAX_KUOTA}) ✅</span>`;
            
            htmlGroups += `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #5eead4; margin: 15px 0 8px 0; font-size: 14px; border-bottom: 1px dashed rgba(153, 246, 228, 0.2); padding-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span>📅 ${tgl}</span> 
                        <span>${statusBadge}</span>
                    </h4>
                    <div class="table-responsive" style="max-height: 310px; overflow-y: auto; border-radius: 10px;">
                        <table>
                            <thead style="position: sticky; top: 0; z-index: 1;">
                                <tr>
                                    <th style="width: 40px; text-align: center;">No</th>
                                    <th>Nama</th>
                                    <th style="width: 90px;">Jam</th>
                                </tr>
                            </thead>
                            <tbody>`;
            
            if (pesertaList.length === 0) {
                htmlGroups += `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 10px; font-style: italic;">Belum ada peserta di tanggal ini</td></tr>`;
            } else {
                pesertaList.forEach((row, idx) => {
                    let namaPeserta = row.nama ? row.nama.toString().toUpperCase() : '-';
                    htmlGroups += `
                        <tr>
                            <td style="text-align: center; font-weight: 600; color: #5eead4;">${idx + 1}</td>
                            <td style="font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">${namaPeserta}</td>
                            <td style="color: #99f6e4;">${row.jam || '-'}</td>
                        </tr>`;
                });
            }

            htmlGroups += `
                            </tbody>
                        </table>
                    </div>
                </div>`;
        });
    }

    if (wrapperGroup) {
        wrapperGroup.innerHTML = htmlGroups;
    }

    if (selectTanggalForm) {
        const options = selectTanggalForm.querySelectorAll('option');
        options.forEach(option => {
            let tglValue = option.value;
            if (tglValue && tglValue !== "") {
                let jumlahPendaftar = countMap[tglValue] || 0;
                if (jumlahPendaftar >= MAX_KUOTA) {
                    option.disabled = true;
                    option.text = tglValue + " (PENUH - 13/13)";
                } else {
                    option.disabled = false;
                    option.text = tglValue + ` (${jumlahPendaftar}/${MAX_KUOTA})`;
                }
            }
        });
    }

    renderAdminTable(globalDataCache);
};

// Fungsi Form Submit Pendaftaran Baru
document.getElementById('pendaftaranForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        action: "tambah",
        nama: document.getElementById('nama').value.toUpperCase(),
        alamat: document.getElementById('alamat').value.toUpperCase(),
        telepon: document.getElementById('telepon').value,
        tanggal: document.getElementById('tanggal').value,
        jam: document.getElementById('jam').value,
        keterangan: document.getElementById('keterangan').value
    };

    const submitBtn = document.getElementById('submitBtn');
    const loadingDiv = document.getElementById('loading');
    
    submitBtn.disabled = true;
    loadingDiv.style.display = 'block';

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        document.getElementById('popupModal').style.display = 'flex';
        document.getElementById('pendaftaranForm').reset();
        setTimeout(loadDataKuota, 1500); 
    })
    .catch(error => {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        alert('Terjadi kesalahan: ' + error);
    });
});

// Fitur Panel Admin
function toggleAdminPanel() {
    let publicView = document.getElementById('publicViewContainer');
    let adminView = document.getElementById('adminViewContainer');
    if (adminView.style.display === 'none') {
        adminView.style.display = 'block';
        publicView.style.display = 'none';
        renderAdminTable(globalDataCache);
    } else {
        adminView.style.display = 'none';
        publicView.style.display = 'block';
    }
}

function renderAdminTable(dataArray) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    let html = "";

    if (dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data peserta.</td></tr>';
        return;
    }

    dataArray.forEach((item, index) => {
        let tglFormatted = formatTanggal(item.tanggal);
        html += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td><b>${item.nama || '-'}</b><br><small style="color:#94a3b8;">${item.telepon || ''}</small></td>
                <td>${tglFormatted}</td>
                <td>${item.jam || '-'}</td>
                <td>${item.keterangan || 'Belum'}</td>
                <td style="text-align: center;">
                    <button type="button" onclick='openEditModal(${JSON.stringify(item)})' style="background:#0d9488; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px;">✏️ Edit</button>
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
    document.getElementById('editAlamat').value = item.alamat || '';
    document.getElementById('editTelepon').value = item.telepon || '';
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
        originalTelepon: document.getElementById('editOriginalTelp').value,
        nama: document.getElementById('editNama').value.toUpperCase(),
        alamat: document.getElementById('editAlamat').value.toUpperCase(),
        telepon: document.getElementById('editTelepon').value,
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
        alert('🎉 Perubahan data berhasil disimpan!');
        closeEditModal();
        setTimeout(loadDataKuota, 1500);
    })
    .catch(err => {
        alert('Terjadi kesalahan: ' + err);
    });
}

function downloadExcel() {
    if (globalDataCache.length === 0) {
        alert("Tidak ada data untuk didownload!");
        return;
    }

    let tableHTML = `<table border="1">
        <thead>
            <tr style="background-color: #0d9488; color: white;">
                <th>No</th>
                <th>Timestamp</th>
                <th>Nama Lengkap</th>
                <th>Alamat</th>
                <th>No WhatsApp</th>
                <th>Tanggal Treatment</th>
                <th>Jam Treatment</th>
                <th>Keterangan Pembayaran</th>
            </tr>
        </thead>
        <tbody>`;
    
    globalDataCache.forEach((item, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.timestamp || ''}</td>
                <td>${item.nama || ''}</td>
                <td>${item.alamat || ''}</td>
                <td>'${item.telepon || ''}</td>
                <td>${formatTanggal(item.tanggal) || ''}</td>
                <td>${item.jam || ''}</td>
                <td>${item.keterangan || ''}</td>
            </tr>`;
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
