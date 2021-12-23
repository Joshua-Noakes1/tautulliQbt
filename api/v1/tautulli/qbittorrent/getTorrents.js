require('dotenv').config();
const api = require('qbittorrent-api-v2');

async function getTorrents() {
    let qbit = {
        success: true,
        api: null,
        torrents: null
    };

    // get qbt api object
    await api.connect(process.env.QBT_URL, process.env.QBT_USER, process.env.QBT_PASS)
        .then(qbt => {
            qbit.api = qbt;
        })
        .catch(err => {
            qbit.success = false;
            console.error(err)
        });

    // get torrents
    await qbit.api.torrents().then(torrents => {
        qbit.torrents = torrents;
    }).catch(err => {
        qbit.success = false;
        console.log(err);
    });

    // return torrents
    return qbit;
}

module.exports = getTorrents;