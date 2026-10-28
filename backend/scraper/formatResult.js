export function format(data){
    return data.map(item => ({
        trainName: item.trainName,
        departure: item.departure,
        arrival: item.arrival,
        fromStation: item.fromStation,
        startingDate: item.startingDate,
        toStation: item.toStation,
        endingDate: item.endingDate,
        classes: item.classes
    }));
}
