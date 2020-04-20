// Developped by QuozGaming
// https://www.quozpowa.com

const { F1TelemetryClient, constants } = require('f1-telemetry-client');
const { PACKETS, SESSION_TYPES, TEAMS, SAFETY_CAR_STATUSES, TYRES } = constants;

const client = new F1TelemetryClient();

var sessionData = {"sessionType":"","m_sessionTimeLeft":0,"m_safetyCarStatus":0,"totalLaps":0};

let session = '';
let fastest_driver;

let yellow_flag;

var express = require('express')
var app = express();
app.set('view engine', 'ejs');
var participants_data = [];
app.get('/', function (req, res) {


    res.render(__dirname + "/classement.ejs");


})
app.get('/data', function (req, res) {
    let result = participants_data.slice();
    

    let result_final = [];
    for(let [i, res] of Object.entries(result)){

        res.m_lastLapTime = best_times[i];
        if(res.m_carPosition){
            result_final.push(res);
        }
    
    }

    result_final.sort(keysrt('m_carPosition'));

    for(let [i, res] of Object.entries(result_final)){

        let index_i = parseInt(i);

        if(index_i == 0){
            if(session === 'R'){
                res.info = "L"+res.m_currentLapNum;
            }else{
                if(res.m_lastLapTime){
                    res.info = fmtMSS(res.m_lastLapTime);
                }
            }
        }
        if(index_i > 0){
            if(session === 'R'){
                if(res.m_resultStatus === 4){
                    res.info = 'DSQ';
                }else if(res.m_resultStatus === 6){
                    res.info = 'DNF';
                }else if(result_final[0].m_currentLapNum-res.m_currentLapNum>1)
                {
                    res.info = '+'+(result_final[0].m_currentLapNum-res.m_currentLapNum)+' L';
                }
                else{
                res.gap = ((result_final[index_i-1].m_totalDistance-result_final[index_i].m_totalDistance)/63).toFixed(3);
                res.info = '+'+res.gap;
                }
            }else{
                if(result_final[0].m_lastLapTime && result_final[index_i].m_lastLapTime){
                res.gap = (parseFloat(result_final[index_i].m_lastLapTime)-parseFloat(result_final[0].m_lastLapTime)).toFixed(3);
                res.info = '+'+res.gap;
                }
            }
        }

    }

    let totalSeconds = sessionData.m_sessionTimeLeft;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    let m_sessionTimeLeft = minutes+':'+seconds;
    let sc_status = SAFETY_CAR_STATUSES[sessionData.m_safetyCarStatus];

    res.json({ result: result_final, yellow_flag, fastest_driver, session,
         m_sessionTimeLeft, sc_status, sc_status_id:sessionData.m_safetyCarStatus });

    })

app.listen(3000)


import { DriverSource } from '../IntercoApp/app/driversource';

import { DiscordCustom } from '../IntercoApp/app/discordcustom';

interface DriverData {
    [key: string]: {fullname : string, shortname : string};
}


function fmtMSS(timeInSeconds) {
    let pad = function (num, size) { return ('000' + num).slice(size * -1); };
    let time: number = parseFloat(timeInSeconds.toFixed(3));
    let minutes = Math.floor(time / 60) % 60;
    let seconds = Math.floor(time - minutes * 60);
    let time_toString = time.toString();
    let milliseconds = time_toString.slice(-3);

    return pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}

let discord_custom = new DiscordCustom();

let channelID: string = "676886528785645578";

let best_times = {};
let m_bestLapTime = 100000;

var drivers_data: DriverData = {};
async function main() {
    try {
        let driver_source = new DriverSource();
        await driver_source.setup();
        drivers_data = driver_source.getData();

    } catch (e) {
        console.log(e);
    }
}


main();

var participants = [];

var lapData = [];

var callEvent = function (data) {



    let i = 0;
    for (let l of lapData) {
        let myonedata = participants_data[i];
        myonedata.m_gridPosition = l.m_gridPosition + 1;
        myonedata.m_carPosition = l.m_carPosition;
        myonedata.m_penalties = l.m_penalties;
        myonedata.m_resultStatus = l.m_resultStatus;
        myonedata.m_currentLapNum = l.m_currentLapNum;

        i++;
    }


    if (data.m_eventStringCode === "SSTA") {
        best_times = {};
        m_bestLapTime = 100000;
    }
    
    

    let date = new Date();
    let result = participants_data.slice();

    if (["SEND", "CHQF", "RCWN"].includes(data.m_eventStringCode)) {

        let msgs = [];
        msgs.push('**Event : ' + data.m_eventStringCode + ' ' + date.getHours().toString().slice(-2) + 'h' + date.getMinutes().toString().slice(-2) + ' - Session ' + SESSION_TYPES[sessionData.sessionType] + ' ' + sessionData.totalLaps + ' tours**');

        result.sort(keysrt('m_carPosition'));

        for (let driver of result) {
            if (driver.m_carPosition) {
                msgs.push(driver.m_carPosition + '. ' + driver.m_name + ' - ' + driver.m_teamId + ' (Tour ' + driver.m_currentLapNum + ', grille ' + driver.m_gridPosition + ', pénalités ' + driver.m_penalties + 's)');

            }
        }
        discord_custom.sendMsgs(channelID, msgs);

    }

}



function keysrt(key) {
    return function (a, b) {
        if (a[key] > b[key]) return 1;
        if (a[key] < b[key]) return -1;
        return 0;
    }
}




client.on(PACKETS.event, callEvent);



var callSession = function (data) {
    sessionData.totalLaps = data.m_totalLaps;
    sessionData.sessionType = data.m_sessionType;
    sessionData.m_sessionTimeLeft = data.m_sessionTimeLeft;
    sessionData.m_safetyCarStatus = data.m_safetyCarStatus;

    yellow_flag = false;
    for(let m of data.m_marshalZones){
        if(m.m_zoneFlag === 3){
            yellow_flag = true;
        }
    }

    session = SESSION_TYPES[sessionData.sessionType];
}

client.on(PACKETS.session, callSession);



var setLapData = function (data) {
    if (!participants_data) {
        return;
    }
    lapData = data.m_lapData;
    let i = 0;
    for (let l of lapData) {
        if (participants_data[i]) {
            let myonedata = participants_data[i];
            myonedata.m_carPosition = l.m_carPosition;
            myonedata.m_totalDistance = l.m_totalDistance;
            myonedata.m_pitStatus = l.m_pitStatus;
            myonedata.m_driverStatus = l.m_driverStatus;
            myonedata.m_resultStatus = l.m_resultStatus;
            myonedata.m_currentLapNum = l.m_currentLapNum;
            myonedata.m_penalties = l.m_penalties;
            if (l.m_lastLapTime && (!(i in best_times) || l.m_lastLapTime < best_times[i])) {
                best_times[i] = l.m_lastLapTime;
                myonedata.m_lastLapTime = l.m_lastLapTime;

                let msgs = [];
                let best_lap = '';
                if (l.m_lastLapTime <= m_bestLapTime) {
                    best_lap = '**MEILLEUR TOUR : **';
                    m_bestLapTime = l.m_lastLapTime;
                    fastest_driver = myonedata.m_raceNumber;
                }
                msgs.push(best_lap + participants_data[i].m_name + ' vient de PB en ' + fmtMSS(best_times[i]) + '. Il est P' + l.m_carPosition + '.');
                discord_custom.sendMsgs(channelID, msgs);
            }
            
        }
            i++;
    }
}

var setCarStatus = function(data){
    let i = 0;
    for (let c of data.m_carStatusData) {
        if (participants_data[i]) {
            let myonedata = participants_data[i];

            let m_tyresWear = c.m_tyresWear.toString().split(',');
            let usure : number = 0;
            for(let tyresWear of m_tyresWear)
            {
                usure = usure+parseInt(tyresWear);
            }

            myonedata.m_tyresWear = Math.round(usure/4);
            if(c.m_tyreVisualCompound && c.m_tyreVisualCompound !== 255){
            let tyre_name = TYRES[c.m_tyreVisualCompound].name.slice(0,1);
            let tyre_color=TYRES[c.m_tyreVisualCompound].color;
            if(TYRES[c.m_tyreVisualCompound].name === 'C5'){
                tyre_name='S';
                tyre_color='#f92d29';
            }else if(TYRES[c.m_tyreVisualCompound].name === 'C4'){
                tyre_name='M';
                tyre_color='#ebd25f';
            }
            else if(TYRES[c.m_tyreVisualCompound].name === 'C3'){
                tyre_name='H';
                tyre_color='#ffffff';
            }
            myonedata.m_actualTyreCompound = tyre_name;
            myonedata.m_tyreColor = tyre_color;
            }
        }
        i++;
    }
}

var setParticipants = function (data) {
    participants = data.m_participants;

    participants_data = [];
    for (let p of participants) {

        let m_name = '';
        let shortname = 'UKN';
        if (p.m_raceNumber.toString() in drivers_data) {
            m_name = drivers_data[p.m_raceNumber].fullname;
            shortname = drivers_data[p.m_raceNumber].shortname;
        } else {
            m_name = p.m_name;
        }
        participants_data.push({ "m_name": m_name,"shortname": shortname, "m_raceNumber": p.m_raceNumber, "m_teamId": TEAMS[p.m_teamId].name, "m_teamColor": TEAMS[p.m_teamId].color });

    }
}

client.on(PACKETS.lapData, setLapData);

client.on(PACKETS.participants, setParticipants);

client.on(PACKETS.carStatus, setCarStatus);

// to start listening:
client.start();