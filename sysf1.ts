const { F1TelemetryClient, constants } = require('f1-telemetry-client');
const { PACKETS, SESSION_TYPES, TEAMS } = constants;

const client = new F1TelemetryClient();


import { DriverSource } from '../IntercoApp/app/driversource';

import { DiscordCustom } from '../IntercoApp/app/discordcustom';

interface DriverData{
    [key: string]: string;
}

let discord_custom = new DiscordCustom();

let channelID : string = "676886528785645578";


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

    var mydata = [];
    for (let p of participants) {

        var m_name = '';
        if (p.m_raceNumber.toString() in drivers_data) {
            m_name = drivers_data[p.m_raceNumber];
        } else {
            m_name = p.m_name;
        }
        mydata.push({ "m_name": m_name, "m_raceNumber": p.m_raceNumber, "m_teamId": TEAMS[p.m_teamId].name });

    }

    let i = 0;
    for (let l of lapData) {
        var myonedata = mydata[i];
        myonedata.m_gridPosition = l.m_gridPosition + 1;
        myonedata.m_carPosition = l.m_carPosition;
        myonedata.m_penalties = l.m_penalties;
        myonedata.m_resultStatus = l.m_resultStatus;
        myonedata.m_currentLapNum = l.m_currentLapNum;

        i++;
    }


    let date = new Date();

    if (["SEND", "CHQF", "RCWN"].includes(data.m_eventStringCode)) {

        let msgs = [];
        msgs.push('**Event : ' + data.m_eventStringCode + ' ' + date.getHours().toString().slice(-2) + 'h' + date.getMinutes().toString().slice(-2) + ' - Session ' + SESSION_TYPES[sessionType] + ' ' + totalLaps + ' tours**');
        
        mydata.sort(keysrt('m_carPosition'));

        for (let driver of mydata) {
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
    lapData = data.m_lapData;
}

var setParticipants = function (data) {
    participants = data.m_participants;
}

client.on(PACKETS.lapData, setLapData);

client.on(PACKETS.participants, setParticipants);

// to start listening:
client.start();