const path = require('path'),
    {
        readJSON,
        writeJSON
    } = require('../../../lib/readWrite'),
    {
        unlinkSync
    } = require('fs'),
    getTorrents = require('./qbittorrent/getTorrents'),
    express = require('express');

// global express router
const router = express.Router();

// Api routes
router.get('/start', async function (req, res) {
    // load torrents and increment counter
    var torrents = await readJSON(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'), true);
    if (torrents.success == false) var torrents = {
        success: true,
        from: 'node',
        watchCount: 0,
        torrents: []
    };
    torrents.watchCount++;

    // get torrents from qbittorrent
    var qbit = await getTorrents();
    if (qbit.success) {
        // loop over torrents, save to file and pause
        qbit.torrents.forEach(async (torrent) => {
            if (torrents.from == 'file') {
                if (torrents.torrents.length > 0) {
                    var fileExists = false;
                    // loop over to add torrents to list
                    await torrents.torrents.forEach((torrentLoop, index, array) => {
                        if (torrentLoop.hash != torrent.hash) {
                            fileExists = true;
                        }
                    });
                    if (fileExists == false) torrents.torrents.push(torrent);
                }
            } else {
                torrents.torrents.push(torrent);
            }

            // stop torrents
            await qbit.api.pauseTorrents(torrent.hash);
        });
    } else {
        return res.status(500).json({
            success: false,
            message: "Could not get torrents from qbittorrent"
        });
    }

    // save torrents to disk
    torrents.from = 'file';
    await writeJSON(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'), torrents, true);
    return res.status(200).json({
        success: true,
        message: "Torrents Stopped"
    });
});


router.get('/stop', async function (req, res) {
    // get qbit api
    var qbit = await getTorrents();

    // load torrents and increment counter then save to disk
    var torrents = await readJSON(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'), true);
    if (torrents.success == false) {
        return res.status(500).json({
            success: false,
            message: "Could not load torrents from disk"
        });
    }
    torrents.watchCount--;
    await writeJSON(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'), torrents, true);

    // wait 2 minutes to see if another stream starts
    await require('timers/promises').setTimeout(25 * 1000);

    // loop over torrents to start if more then one watch time isnt running
    var torrent = await readJSON(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'), true);
    if (torrent.success == false) {
        return res.status(500).json({
            success: false,
            message: "Could not load torrents from disk"
        });
    }
    if (torrent.watchCount <= 0) {
        await torrent.torrents.forEach(async (torrents) => {
            if (torrents.state == "downloading") {
                await qbit.api.resumeTorrents(torrents.hash);
            }
        });
        await unlinkSync(path.join(__dirname, '../', '../', '../', 'data', 'torrents.json'));

        return res.status(200).json({
            success: true,
            message: "Torrents Started"
        });
    } else {
        return res.status(400).json({
            success: true,
            message: "Torrents Not Started, Still Playing"
        });
    }


});

module.exports = router;