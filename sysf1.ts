const { F1TelemetryClient, constants } = require('f1-telemetry-client');
const { PACKETS, SESSION_TYPES, TEAMS } = constants;

const client = new F1TelemetryClient();


import { DriverSource } from '../IntercoApp/app/driversource';

import { DiscordCustom } from '../IntercoApp/app/discordcustom';

interface DriverData{
    [key: string]: string;
}


function fmtMSS(timeInSeconds) {
    let pad = function(num, size) { return ('000' + num).slice(size * -1); };
    let time : number = parseFloat(timeInSeconds.toFixed(3));
    let minutes = Math.floor(time / 60) % 60;
    let seconds = Math.floor(time - minutes * 60);
    let milliseconds = time.toString().slice(-3);

    return  pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}

let discord_custom = new DiscordCustom();

let channelID : string = "676886528785645578";

let best_times = {};

var drivers_data : DriverData;
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
        var myonedata = participants_data[i];
        myonedata.m_gridPosition = l.m_gridPosition + 1;
        myonedata.m_carPosition = l.m_carPosition;
        myonedata.m_penalties = l.m_penalties;
        myonedata.m_resultStatus = l.m_resultStatus;
        myonedata.m_currentLapNum = l.m_currentLapNum;

        i++;
    }


    if(data.m_eventStringCode === "SSTA"){
        best_times = {};
    }

    let date = new Date();

    if (["SEND", "CHQF", "RCWN"].includes(data.m_eventStringCode)) {

        let msgs = [];
        msgs.push('**Event : ' + data.m_eventStringCode + ' ' + date.getHours().toString().slice(-2) + 'h' + date.getMinutes().toString().slice(-2) + ' - Session ' + SESSION_TYPES[sessionType] + ' ' + totalLaps + ' tours**');
        
        participants_data.sort(keysrt('m_carPosition'));

        for (let driver of participants_data) {
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

var totalLaps;
var sessionType;

var callSession = function (data) {
    totalLaps = data.m_totalLaps;
    sessionType = data.m_sessionType;
}

client.on(PACKETS.session, callSession);



var setLapData = function (data) {
    if(!participants_data){
        return ;
    }
    lapData = data.m_lapData;
    let i = 0;
    for(let l of lapData){
        if(l.m_lastLapTime && (!(i in best_times) || l.m_lastLapTime < best_times[i]))
        {
            best_times[i] = l.m_lastLapTime;
            
            let msgs = [];
            msgs.push(participants_data[i].m_name+' vient de PB en '+fmtMSS(best_times[i])+'. Il est P'+l.m_carPosition+'.');
            discord_custom.sendMsgs(channelID, msgs);
        }
        i++;
    }
}

var participants_data;

var setParticipants = function (data) {
    participants = data.m_participants;

    participants_data = [];
    for (let p of participants) {

        var m_name = '';
        if (p.m_raceNumber.toString() in drivers_data) {
            m_name = drivers_data[p.m_raceNumber];
        } else {
            m_name = p.m_name;
        }
        participants_data.push({ "m_name": m_name, "m_raceNumber": p.m_raceNumber, "m_teamId": TEAMS[p.m_teamId].name });

    }
}

client.on(PACKETS.lapData, setLapData);

client.on(PACKETS.participants, setParticipants);

// to start listening:
client.start();