### Workers - allow you to run tasks

##### Interval-Workers
Workers are great if you want a task to happen asynchronously in the background without user/client triggering
if you wanted to create a 'cron' worker you would go about this similarly to

Example:

    module.exports = function() {
        let now = new Date();
        if(now.getHour() === 6 && now.getMinute() === 30) {//only acts at 6:30 am
            //do things
        }
    };
    module.exports.interval = 60000;//every minute
