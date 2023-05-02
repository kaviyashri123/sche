var readyQueue = [];
var arrangedReadyQueue = [];
var timeQuanta;
var stop_flag = false;
function readyQueueInit() {
    for(i = 0; i < processes.length; i++){
        let copiedProcess = Object.assign({}, processes[i]);
        readyQueue[i] = copiedProcess;
    }
}
//formula1
function calculateTimeQuanta() {
    let sum, temp, max;
    if (readyQueue.length != 0) {
        max = Number.MIN_VALUE;
        sum = 0;
        for(let i = 0; i < readyQueue.length; i++){
            temp = readyQueue[i].burst_time;
            sum += temp;
            if (temp > max) max = temp;
        }
        timeQuanta = Math.sqrt(1.0 * sum / readyQueue.length * max);
    } else timeQuanta = 0;
}
function calculateBurstTimePriority() {
    let duplicate = [];
    let flag = [];
    for(i in readyQueue){
        duplicate[i] = readyQueue[i].burst_time;
        flag[i] = false;
    }
    duplicate.sort(function(a1, b) {
        return a1 - b;
    });
    for(p in readyQueue){
        for(d in duplicate)if (readyQueue[p].burst_time === duplicate[d] && !flag[d]) {
            readyQueue[p].burstTimePriority = Number(d) + 1;
            flag[d] = true;
            break;
        }
    }
}
//formula2
function calculateF() {
    for(p in readyQueue)readyQueue[p].f = 1.0 * (3 * readyQueue[p].priority + readyQueue[p].burstTimePriority) / 4;
}
function calculateFRank() {
    let duplicate = [];
    let flag = [];
    for(p in readyQueue){
        duplicate[p] = readyQueue[p].f;
        flag[p] = false;
    }
    duplicate.sort(function(a1, b) {
        return a1 - b;
    });
    for(p in readyQueue){
        for(d in duplicate)if (readyQueue[p].f === duplicate[d] && !flag[d]) {
            readyQueue[p].fRank = Number(d) + 1;
            flag[d] = true;
            break;
        }
    }
}
function sortByFRank() {
    let j, minRank;
    let process;
    while(readyQueue.length != 0){
        minRank = Number.MAX_VALUE;
        for(p in readyQueue)if (readyQueue[p].fRank < minRank) {
            minRank = readyQueue[p].fRank;
            process = readyQueue[p];
            j = p;
        }
        arrangedReadyQueue.push(process);
        readyQueue.splice(j, 1);
    }
}
function getProcessById(id) {
    for(p in processes){
        if (processes[p].id == id) return processes[p];
    }
}
function calculateAvgTime(waitingTime) {
    let avg = 0;
    for(i = 1; i < waitingTime.length; i++)avg += waitingTime[i];
    return avg / (waitingTime.length - 1);
}
var avgWaitingTimeFCFS = 0, avgTurnaroundTimeFCFS = 0, avgResponseTimeFCFS = 0;
var ganttFCFS = [];
var completionTimeFCFS = 0;
async function FCFS(flag) {
    readyQueueInit();
    let p1, min;
    let turnAroundFCFS = [];
    let waitingFCFS = [];
    let processQueue = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length === 0) {
            if (ganttFCFS.length > 0 && ganttFCFS[ganttFCFS.length - 1].processId != null) {
                ganttFCFS[ganttFCFS.length - 1].endTime = time;
                ganttFCFS.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttFCFS.length == 0) ganttFCFS.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue outer;
        }
        let vis_block = "";
        min = Number.MAX_VALUE;
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].arrival_time < min) {
                min = processQueue[process];
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("FCFS");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time += processQueue[p1].burst_time;
        turnAroundFCFS[processQueue[p1].id] = time - processQueue[p1].arrival_time;
        waitingFCFS[processQueue[p1].id] = turnAroundFCFS[processQueue[p1].id] - processQueue[p1].burst_time;
        for(let pro1 in readyQueue)if (readyQueue[pro1].id === processQueue[p1].id) readyQueue.splice(pro1, 1);
        if (ganttFCFS.length > 0) ganttFCFS[ganttFCFS.length - 1].endTime = prev_time;
        ganttFCFS.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        processQueue.splice(0, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    completionTimeFCFS = time;
    avgTurnaroundTimeFCFS = calculateAvgTime(turnAroundFCFS);
    avgWaitingTimeFCFS = calculateAvgTime(waitingFCFS);
    avgResponseTimeFCFS = avgWaitingTimeFCFS;
}
var avgWaitingTimeSJFNonPre = 0, avgTurnaroundTimeSJFNonPre = 0, avgResponseTimeSJFNonPre = 0;
var ganttSJFNonPre = [];
var completionTimeSJF = 0;
async function SJFNonPre(flag) {
    readyQueueInit();
    let min = Number.MAX_VALUE;
    let p1;
    let turnAroundSJFNonPre = [];
    let waitingSJFNonPre = [];
    let processQueue = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length === 0) {
            if (ganttSJFNonPre.length > 0 && ganttSJFNonPre[ganttSJFNonPre.length - 1].processId != null) {
                ganttSJFNonPre[ganttSJFNonPre.length - 1].endTime = time;
                ganttSJFNonPre.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttSJFNonPre.length == 0) ganttSJFNonPre.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue outer;
        }
        min = Number.MAX_VALUE;
        let vis_block = "";
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].burst_time < min) {
                min = processQueue[process].burst_time;
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("SJF (non pre)");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time += processQueue[p1].burst_time;
        if (ganttSJFNonPre.length > 0) ganttSJFNonPre[ganttSJFNonPre.length - 1].endTime = prev_time;
        ganttSJFNonPre.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        turnAroundSJFNonPre[processQueue[p1].id] = time - processQueue[p1].arrival_time;
        waitingSJFNonPre[processQueue[p1].id] = turnAroundSJFNonPre[processQueue[p1].id] - processQueue[p1].burst_time;
        for(pro in readyQueue)if (readyQueue[pro].id === processQueue[p1].id) readyQueue.splice(pro, 1);
        processQueue.splice(0, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    completionTimeSJF = time;
    avgTurnaroundTimeSJFNonPre = calculateAvgTime(turnAroundSJFNonPre);
    avgWaitingTimeSJFNonPre = calculateAvgTime(waitingSJFNonPre);
    avgResponseTimeSJFNonPre = avgWaitingTimeSJFNonPre;
}
var avgWaitingTimeSJFPre = 0, avgTurnaroundTimeSJFPre = 0, avgResponseTimeSJFPre = 0;
var ganttSJFPre = [];
var completionTimeSJFPre = 0;
async function SJFPre(flag) {
    readyQueueInit();
    let min = Number.MAX_VALUE;
    let p1;
    let turnAroundSJFPre = [];
    let waitingSJFPre = [];
    let responseSJFPre = [];
    let processQueue = [];
    let completionTime = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length === 0) {
            if (ganttSJFPre.length > 0 && ganttSJFPre[ganttSJFPre.length - 1].processId != null) {
                ganttSJFPre[ganttSJFPre.length - 1].endTime = time;
                ganttSJFPre.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttSJFPre.length == 0) ganttSJFPre.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue;
        }
        min = Number.MAX_VALUE;
        let vis_block = "";
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].burst_time < min) {
                min = processQueue[process].burst_time;
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("SJF (pre)");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time++;
        if (ganttSJFPre.length > 0 && ganttSJFPre[ganttSJFPre.length - 1].processId != processQueue[p1].id) {
            ganttSJFPre[ganttSJFPre.length - 1].endTime = prev_time;
            ganttSJFPre.push({
                processId: processQueue[p1].id,
                startTime: prev_time,
                endTime: time
            });
        } else if (ganttSJFPre.length == 0) ganttSJFPre.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        if (processQueue[p1].burst_time === getProcessById(processQueue[p1].id).burst_time) //It means came for the first time
        responseSJFPre[processQueue[p1].id] = prev_time - processQueue[p1].arrival_time;
        processQueue[p1].burst_time--;
        if (processQueue[p1].burst_time == 0) {
            completionTime[processQueue[p1].id] = time;
            for(let process in readyQueue)if (readyQueue[process].id == processQueue[p1].id) readyQueue.splice(process, 1);
        }
        processQueue.splice(p1, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    for(p1 in processes){
        turnAroundSJFPre[processes[p1].id] = completionTime[processes[p1].id] - processes[p1].arrival_time;
        waitingSJFPre[processes[p1].id] = turnAroundSJFPre[processes[p1].id] - processes[p1].burst_time;
    }
    if (ganttSJFPre.length > 0) ganttSJFPre[ganttSJFPre.length - 1].endTime = time;
    completionTimeSJFPre = time;
    avgTurnaroundTimeSJFPre = calculateAvgTime(turnAroundSJFPre);
    avgWaitingTimeSJFPre = calculateAvgTime(waitingSJFPre);
    avgResponseTimeSJFPre = calculateAvgTime(responseSJFPre);
}
var avgWaitingTimePriorityNonPre = 0, avgTurnaroundTimePriorityNonPre = 0, avgResponseTimePriorityNonPre = 0;
var ganttPriorityNonPre = [];
var completionTimePriority = 0;
async function priorityNonPre(flag) {
    readyQueueInit();
    let min = Number.MAX_VALUE;
    let p1;
    let processQueue = [];
    let turnAroundPriorityNonPre = [];
    let waitingPriorityNonPre = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length === 0) {
            if (ganttPriorityNonPre.length > 0 && ganttPriorityNonPre[ganttPriorityNonPre.length - 1].processId != null) {
                ganttPriorityNonPre[ganttPriorityNonPre.length - 1].endTime = time;
                ganttPriorityNonPre.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttPriorityNonPre.length == 0) ganttPriorityNonPre.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue;
        }
        min = Number.MAX_VALUE;
        let vis_block = "";
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].priority < min) {
                min = processQueue[process].priority;
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("Priority (non pre)");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time += processQueue[p1].burst_time;
        if (ganttPriorityNonPre.length > 0) ganttPriorityNonPre[ganttPriorityNonPre.length - 1].endTime = prev_time;
        ganttPriorityNonPre.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        turnAroundPriorityNonPre[processQueue[p1].id] = time - processQueue[p1].arrival_time;
        waitingPriorityNonPre[processQueue[p1].id] = turnAroundPriorityNonPre[processQueue[p1].id] - processQueue[p1].burst_time;
        for(pro in readyQueue)if (readyQueue[pro].id === processQueue[p1].id) readyQueue.splice(pro, 1);
        processQueue.splice(0, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    completionTimePriority = time;
    avgTurnaroundTimePriorityNonPre = calculateAvgTime(turnAroundPriorityNonPre);
    avgWaitingTimePriorityNonPre = calculateAvgTime(waitingPriorityNonPre);
    avgResponseTimePriorityNonPre = avgWaitingTimePriorityNonPre;
}
var avgWaitingTimePriorityPre = 0, avgTurnaroundTimePriorityPre = 0, avgResponseTimePriorityPre = 0;
var ganttPriorityPre = [];
var completionTimePriorityPre = 0;
async function priorityPre(flag) {
    readyQueueInit();
    let min = Number.MAX_VALUE;
    let p1;
    let turnAroundPriorityPre = [];
    let waitingPriorityPre = [];
    let responsePriorityPre = [];
    let processQueue = [];
    let completionTime = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length == 0) {
            if (ganttPriorityPre.length > 0 && ganttPriorityPre[ganttPriorityPre.length - 1].processId != null) {
                ganttPriorityPre[ganttPriorityPre.length - 1].endTime = time;
                ganttPriorityPre.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttPriorityPre.length == 0) ganttPriorityPre.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue outer;
        }
        min = Number.MAX_VALUE;
        let vis_block = "";
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].priority < min) {
                min = processQueue[process].priority;
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("Priority (pre)");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time++;
        if (ganttPriorityPre.length > 0 && ganttPriorityPre[ganttPriorityPre.length - 1].processId != processQueue[p1].id) {
            ganttPriorityPre[ganttPriorityPre.length - 1].endTime = prev_time;
            ganttPriorityPre.push({
                processId: processQueue[p1].id,
                startTime: prev_time,
                endTime: time
            });
        } else if (ganttPriorityPre.length == 0) ganttPriorityPre.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        if (processQueue[p1].burst_time === getProcessById(processQueue[p1].id).burst_time) //It means came for the first time
        responsePriorityPre[processQueue[p1].id] = prev_time - processQueue[p1].arrival_time;
        let index;
        for(pro in readyQueue)if (readyQueue[pro].id === processQueue[p1].id) index = pro;
        processQueue[p1].burst_time--;
        if (processQueue[p1].burst_time === 0) {
            completionTime[processQueue[p1].id] = time;
            readyQueue.splice(index, 1);
        }
        processQueue.splice(0, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    for(p1 in processes){
        turnAroundPriorityPre[processes[p1].id] = completionTime[processes[p1].id] - processes[p1].arrival_time;
        waitingPriorityPre[processes[p1].id] = turnAroundPriorityPre[processes[p1].id] - processes[p1].burst_time;
    }
    completionTimePriorityPre = time;
    if (ganttPriorityPre.length > 0) ganttPriorityPre[ganttPriorityPre.length - 1].endTime = time;
    avgTurnaroundTimePriorityPre = calculateAvgTime(turnAroundPriorityPre);
    avgWaitingTimePriorityPre = calculateAvgTime(waitingPriorityPre);
    avgResponseTimePriorityPre = calculateAvgTime(responsePriorityPre);
}
var avgWaitingTimeRoundRobin = 0, avgTurnaroundTimeRoundRobin = 0, avgResponseTimeRoundRobin = 0;
var ganttRoundRobin = [];
var completionTimeRoundRobin = 0;
async function roundRobin(flag1) {
    readyQueueInit();
    let timeQuanta = Number($("#time_quanta").val());
    if (timeQuanta == 0) timeQuanta = 70;
    let time = 0;
    let processQueue = [];
    let min, p1, j, flag;
    let completionTime = [];
    let turnAroundRR = [];
    let responseRR = [];
    let waitingRR = [];
    let runningQueue = [];
    if (flag1) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    // getting the initial processes in to the process queue
    while(true){
        if (readyQueue.length == 0) break;
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length === 0) {
            if (ganttRoundRobin.length > 0 && ganttRoundRobin[ganttRoundRobin.length - 1].processId != null) {
                ganttRoundRobin[ganttRoundRobin.length - 1].endTime = time;
                ganttRoundRobin.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttRoundRobin.length == 0) ganttRoundRobin.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue;
        }
        break;
    }
    //then one by one all the processes
    outer: while(processQueue.length != 0){
        prev_time = time;
        let currentProcess = processQueue[0];
        if (currentProcess.burst_time === getProcessById(currentProcess.id).burst_time) //It means came for the first time
        responseRR[currentProcess.id] = prev_time - currentProcess.arrival_time;
        if (currentProcess.burst_time > timeQuanta) {
            currentProcess.burst_time -= timeQuanta;
            time += timeQuanta;
            flag = true;
        } else {
            flag = false;
            time += currentProcess.burst_time;
            completionTime[currentProcess.id] = time;
            for(let process in readyQueue)if (readyQueue[process].id == currentProcess.id) {
                readyQueue.splice(process, 1);
                break;
            }
        }
        let vis_block = "";
        for(let process in processQueue)vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
        if (flag1) {
            $("#vis_name").empty().append("Round Robin");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${currentProcess.id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        if (ganttRoundRobin.length > 0) ganttRoundRobin[ganttRoundRobin.length - 1].endTime = prev_time;
        ganttRoundRobin.push({
            processId: currentProcess.id,
            startTime: prev_time,
            endTime: time
        });
        //Taking remaining process and pushing them in running queue
        while(true){
            if (readyQueue.length == 0) break;
            for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) runningQueue.push(readyQueue[process]);
            if (runningQueue.length === 0) {
                if (ganttRoundRobin.length > 0 && ganttRoundRobin[ganttRoundRobin.length - 1].processId != null) {
                    ganttRoundRobin[ganttRoundRobin.length - 1].endTime = time;
                    ganttRoundRobin.push({
                        processId: null,
                        startTime: time,
                        endTime: time + 1
                    });
                } else if (ganttRoundRobin.length == 0) ganttRoundRobin.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
                time++;
                continue;
            }
            // now taking those processes from running queue to process queue which has minimum arrival time
            while(runningQueue.length != 0){
                min = Number.MAX_VALUE;
                for(let process in runningQueue)if (runningQueue[process].arrival_time < min) {
                    min = runningQueue[process].arrival_time;
                    j = process;
                }
                if (!processQueue.includes(runningQueue[j])) processQueue.push(runningQueue[j]);
                runningQueue.splice(j, 1);
            }
            break;
        }
        if (flag == true) processQueue.push(currentProcess);
        processQueue.shift();
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    for(p1 in processes){
        turnAroundRR[processes[p1].id] = completionTime[processes[p1].id] - processes[p1].arrival_time;
        waitingRR[processes[p1].id] = turnAroundRR[processes[p1].id] - processes[p1].burst_time;
    }
    completionTimeRoundRobin = time;
    avgTurnaroundTimeRoundRobin = calculateAvgTime(turnAroundRR);
    avgWaitingTimeRoundRobin = calculateAvgTime(waitingRR);
    avgResponseTimeRoundRobin = calculateAvgTime(responseRR);
}
var avgTurnaroundTimeLJFNonPre = 0, avgWaitingTimeLJFNonPre = 0, avgResponseTimeLJFNonPre = 0;
var ganttLJFNonPre = [];
var completionTimeLJF = 0;
async function LJFNonPre(flag) {
    readyQueueInit();
    let max = Number.MIN_VALUE;
    let p1;
    let turnAroundLJFNonPre = [];
    let waitingLJFNonPre = [];
    let processQueue = [];
    let time = 0;
    if (flag) {
        $("#wq").attr("hidden", true);
        $("#vis").removeAttr("hidden");
        $("html, body").animate({
            scrollTop: $("#vis").offset().top
        }, 0);
    }
    outer: while(readyQueue.length != 0){
        for(let process in readyQueue)if (readyQueue[process].arrival_time <= time) processQueue.push(readyQueue[process]);
        if (processQueue.length == 0) {
            if (ganttLJFNonPre.length > 0 && ganttLJFNonPre[ganttLJFNonPre.length - 1].processId != null) {
                ganttLJFNonPre[ganttLJFNonPre.length - 1].endTime = time;
                ganttLJFNonPre.push({
                    processId: null,
                    startTime: time,
                    endTime: time + 1
                });
            } else if (ganttLJFNonPre.length == 0) ganttLJFNonPre.push({
                processId: null,
                startTime: time,
                endTime: time + 1
            });
            time++;
            continue outer;
        }
        max = Number.MIN_VALUE;
        let vis_block = "";
        for(let process in processQueue){
            vis_block += `<span class='fitem'>P${processQueue[process].id}</span>`;
            if (processQueue[process].burst_time > max) {
                max = processQueue[process].burst_time;
                p1 = process;
            }
        }
        if (flag) {
            $("#vis_name").empty().append("LJF (non pre)");
            $("#vis_rq").empty().html(vis_block);
            $("#vis_cpu").empty().html(`<span class='fitem'>P${processQueue[p1].id}</span>`);
            $("#vis_time").empty().append(time);
            $(".btn").attr("disabled", true);
            await new Promise((r1)=>setTimeout(r1, 2000));
            if (stop_flag) break outer;
        }
        prev_time = time;
        time += processQueue[p1].burst_time;
        if (ganttLJFNonPre.length > 0) ganttLJFNonPre[ganttLJFNonPre.length - 1].endTime = prev_time;
        ganttLJFNonPre.push({
            processId: processQueue[p1].id,
            startTime: prev_time,
            endTime: time
        });
        turnAroundLJFNonPre[processQueue[p1].id] = time - processQueue[p1].arrival_time;
        waitingLJFNonPre[processQueue[p1].id] = turnAroundLJFNonPre[processQueue[p1].id] - processQueue[p1].burst_time;
        for(pro in readyQueue)if (readyQueue[pro].id === processQueue[p1].id) readyQueue.splice(pro, 1);
        processQueue.splice(0, processQueue.length);
    }
    $(".btn").removeAttr("disabled");
    stop_flag = false;
    completionTimeLJF = time;
    avgTurnaroundTimeLJFNonPre = calculateAvgTime(turnAroundLJFNonPre);
    avgWaitingTimeLJFNonPre = calculateAvgTime(waitingLJFNonPre);
    avgResponseTimeLJFNonPre = avgWaitingTimeLJFNonPre;
}
var resultTable;
function createResultTable() {
    let resultHeaders = [
        "Scheduling Algorithm",
        "Average Turnaround Time",
        "Average Waiting Time"
    ];
    let results = [
        {
            name: "FCFS",
            avgTA: avgTurnaroundTimeFCFS.toFixed(2),
            avgWT: avgWaitingTimeFCFS.toFixed(2)
        },
        {
            name: "SJF",
            avgTA: avgTurnaroundTimeSJFNonPre.toFixed(2),
            avgWT: avgWaitingTimeSJFNonPre.toFixed(2)
        },
        {
            name: "SJF(Preemptive)",
            avgTA: avgTurnaroundTimeSJFPre.toFixed(2),
            avgWT: avgWaitingTimeSJFPre.toFixed(2)
        },
        {
            name: "LJF",
            avgTA: avgTurnaroundTimeLJFNonPre.toFixed(2),
            avgWT: avgWaitingTimeLJFNonPre.toFixed(2)
        },
        {
            name: "Priority",
            avgTA: avgTurnaroundTimePriorityNonPre.toFixed(2),
            avgWT: avgWaitingTimePriorityNonPre.toFixed(2)
        },
        {
            name: "Priority(Preemptive)",
            avgTA: avgTurnaroundTimePriorityPre.toFixed(2),
            avgWT: avgWaitingTimePriorityPre.toFixed(2)
        },
        {
            name: "RoundRobin",
            avgTA: avgTurnaroundTimeRoundRobin.toFixed(2),
            avgWT: avgWaitingTimeRoundRobin.toFixed(2)
        }
    ];
    header = "";
    for(head in resultHeaders)header += "<th>" + resultHeaders[head] + "</th>";
    $("#result_table").append(`<thead><tr>${header}</tr></thead>`);
    data = "";
    for(r in results){
        let row = "";
        for(obj in results[r])row += "<td>" + results[r][obj] + "</td>";
        data += "<tr>" + row + "</tr>";
    }
    $("#result_table").append(`<tbody>${data}</tbody>`);
}
function init() {
    avgWaitingTimeRoundRobin = 0;
    avgWaitingTimePriorityPre = 0;
    avgWaitingTimePriorityNonPre = 0;
    avgWaitingTimeSJFPre = 0;
    avgWaitingTimeSJFNonPre = 0;
    avgWaitingTimeLJFNonPre = 0;
    avgWaitingTimeFCFS = 0;
    avgTurnaroundTimeLJFNonPre = 0;
    avgTurnaroundTimeRoundRobin = 0;
    avgTurnaroundTimePriorityPre = 0;
    avgTurnaroundTimePriorityNonPre = 0;
    avgTurnaroundTimeSJFPre = 0;
    avgTurnaroundTimeSJFNonPre = 0;
    avgTurnaroundTimeFCFS = 0;
    avgResponseTimeRoundRobin = 0;
    avgResponseTimePriorityPre = 0;
    avgResponseTimePriorityNonPre = 0;
    avgResponseTimeSJFPre = 0;
    avgResponseTimeSJFNonPre = 0;
    avgResponseTimeLJFNonPre = 0;
    avgResponseTimeFCFS = 0;
    ganttFCFS = [];
    ganttSJFNonPre = [];
    ganttSJFPre = [];
    ganttPriorityNonPre = [];
    ganttPriorityPre = [];
    ganttRoundRobin = [];
    ganttLJFNonPre = [];
    bestAlgo = [];
    completionTimeFCFS = 0;
    completionTimeSJF = 0;
    completionTimeSJFPre = 0;
    completionTimePriority = 0;
    completionTimePriorityPre = 0;
    completionTimeLJF = 0;
    completionTimeRoundRobin = 0;
    $("#gantt_FCFS").empty();
    $("#gantt_SJFNonPre").empty();
    $("#gantt_SJFPre").empty();
    $("#gantt_LJFNonPre").empty();
    $("#gantt_PriorityNonPre").empty();
    $("#gantt_PriorityPre").empty();
    $("#gantt_RoundRobin").empty();
    $("#final_result").empty();
}
function displayResultTable() {
    $("#result_table").empty();
    createResultTable();
}
function displayGanttChart() {
    for(i in ganttFCFS){
        let diff = ganttFCFS[i].endTime - ganttFCFS[i].startTime + 80;
        if (ganttFCFS[i].processId != null) $("#gantt_FCFS").append(`<div class="gantt-box" style="width: ${diff}px"><span class="gantt-box-left">${ganttFCFS[i].startTime}</span>P${ganttFCFS[i].processId}<span class="gantt-box-right">${ganttFCFS[i].endTime}<span></div>`);
        else $("#gantt_FCFS").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttFCFS[i].startTime}</span><span class="gantt-box-right">${ganttFCFS[i].endTime}<span></div>`);
    }
    for(i in ganttSJFNonPre){
        let diff = ganttSJFNonPre[i].endTime - ganttSJFNonPre[i].startTime + 80;
        if (ganttSJFNonPre[i].processId != null) $("#gantt_SJFNonPre").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttSJFNonPre[i].startTime}</span>P${ganttSJFNonPre[i].processId}<span class="gantt-box-right">${ganttSJFNonPre[i].endTime}<span></div>`);
        else $("#gantt_SJFNonPre").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttSJFNonPre[i].startTime}</span><span class="gantt-box-right">${ganttSJFNonPre[i].endTime}<span></div>`);
    }
    for(i in ganttSJFPre){
        let diff = ganttSJFPre[i].endTime - ganttSJFPre[i].startTime + 80;
        if (ganttSJFPre[i].processId != null) $("#gantt_SJFPre").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttSJFPre[i].startTime}</span>P${ganttSJFPre[i].processId}<span class="gantt-box-right">${ganttSJFPre[i].endTime}<span></div>`);
        else $("#gantt_SJFPre").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttSJFPre[i].startTime}</span><span class="gantt-box-right">${ganttSJFPre[i].endTime}<span></div>`);
    }
    for(i in ganttLJFNonPre){
        let diff = ganttLJFNonPre[i].endTime - ganttLJFNonPre[i].startTime + 80;
        if (ganttLJFNonPre[i].processId != null) $("#gantt_LJFNonPre").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttLJFNonPre[i].startTime}</span>P${ganttLJFNonPre[i].processId}<span class="gantt-box-right">${ganttLJFNonPre[i].endTime}<span></div>`);
        else $("#gantt_LJFNonPre").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttLJFNonPre[i].startTime}</span><span class="gantt-box-right">${ganttLJFNonPre[i].endTime}<span></div>`);
    }
    for(i in ganttPriorityNonPre){
        let diff = ganttPriorityNonPre[i].endTime - ganttPriorityNonPre[i].startTime + 80;
        if (ganttPriorityNonPre[i].processId != null) $("#gantt_PriorityNonPre").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttPriorityNonPre[i].startTime}</span>P${ganttPriorityNonPre[i].processId}<span class="gantt-box-right">${ganttPriorityNonPre[i].endTime}<span></div>`);
        else $("#gantt_PriorityNonPre").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttPriorityNonPre[i].startTime}</span><span class="gantt-box-right">${ganttPriorityNonPre[i].endTime}<span></div>`);
    }
    for(i in ganttPriorityPre){
        let diff = ganttPriorityPre[i].endTime - ganttPriorityPre[i].startTime + 80;
        if (ganttPriorityPre[i].processId != null) $("#gantt_PriorityPre").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttPriorityPre[i].startTime}</span>P${ganttPriorityPre[i].processId}<span class="gantt-box-right">${ganttPriorityPre[i].endTime}<span></div>`);
        else $("#gantt_PriorityPre").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttPriorityPre[i].startTime}</span><span class="gantt-box-right">${ganttPriorityPre[i].endTime}<span></div>`);
    }
    for(i in ganttRoundRobin){
        let diff = ganttRoundRobin[i].endTime - ganttRoundRobin[i].startTime + 80;
        if (ganttRoundRobin[i].processId != null) $("#gantt_RoundRobin").append(`<div class="gantt-box" style="width:${diff}px"><span class="gantt-box-left">${ganttRoundRobin[i].startTime}</span>P${ganttRoundRobin[i].processId}<span class="gantt-box-right">${ganttRoundRobin[i].endTime}<span></div>`);
        else $("#gantt_RoundRobin").append(`<div class="gantt-box" style="background-color: #58D68D; width: ${diff}px"><span class="gantt-box-left">${ganttRoundRobin[i].startTime}</span><span class="gantt-box-right">${ganttRoundRobin[i].endTime}<span></div>`);
    }
}
let bestAlgo = [];
function calculateRank(a1, b) {
    let duplicate = [];
    let rank = [];
    currentRank = 0;
    for(i in a1)duplicate[i] = a1[i];
    if (b === 1) duplicate.sort((a1, b)=>{
        return a1 - b;
    });
    else duplicate.sort((a1, b)=>{
        return b - a1;
    });
    let set = new Set(duplicate);
    set.forEach((values)=>{
        currentRank++;
        for(i in a1)if (a1[i] === values) rank[i] = currentRank;
    });
    return rank;
}
function findBest(checked) {
    let algorithms = [
        "FCFS",
        "SJF",
        "SJF(Preemptive)",
        "LJF",
        "Priority",
        "Priority(Preemptive)",
        "Round Robin"
    ];
    let wt = [
        avgWaitingTimeFCFS,
        avgWaitingTimeSJFNonPre,
        avgWaitingTimeSJFPre,
        avgWaitingTimeLJFNonPre,
        avgWaitingTimePriorityNonPre,
        avgWaitingTimePriorityPre,
        avgWaitingTimeRoundRobin
    ];
    let tat = [
        avgTurnaroundTimeFCFS,
        avgTurnaroundTimeSJFNonPre,
        avgTurnaroundTimeSJFPre,
        avgTurnaroundTimeLJFNonPre,
        avgTurnaroundTimePriorityNonPre,
        avgTurnaroundTimePriorityPre,
        avgTurnaroundTimeRoundRobin
    ];
    let rt = [
        avgResponseTimeFCFS,
        avgResponseTimeSJFNonPre,
        avgResponseTimeSJFPre,
        avgResponseTimeLJFNonPre,
        avgResponseTimePriorityNonPre,
        avgResponseTimePriorityPre,
        avgResponseTimeRoundRobin
    ];
    let ct = [
        completionTimeFCFS,
        completionTimeSJF,
        completionTimeSJFPre,
        completionTimeLJF,
        completionTimePriority,
        completionTimePriorityPre,
        completionTimeRoundRobin
    ];
    let cs = [
        ganttFCFS.length - 1,
        ganttSJFNonPre.length - 1,
        ganttSJFPre.length - 1,
        ganttLJFNonPre.length - 1,
        ganttPriorityNonPre.length - 1,
        ganttPriorityPre.length - 1,
        ganttRoundRobin.length - 1
    ];
    let cpuUtil = [];
    let throughput = [];
    let minArrivalTime = Number.MAX_VALUE;
    for(p in processes)if (processes[p].arrival_time < minArrivalTime) minArrivalTime = processes[p].arrival_time;
    for(i in cs)if (i != cs.length - 1) {
        cpuUtil.push(ct[i] / (ct[i] + cs[i]));
        throughput.push(processes.length / (ct[i] + cs[i] - minArrivalTime));
    } else {
        cpuUtil.push(ct[i] / (ct[i] + cs[i]));
        throughput.push(processes.length / (ct[i] + cs[i]));
    }
    let throughputRank = [];
    let cpuUtilRank = [];
    let wtRank = [];
    let tatRank = [];
    let rtRank = [];
    let rank = [];
    throughputRank = calculateRank(throughput, 0);
    cpuUtilRank = calculateRank(cpuUtil, 0);
    wtRank = calculateRank(wt, 1);
    tatRank = calculateRank(tat, 1);
    rtRank = calculateRank(rt, 1);
    let minRank = Number.MAX_VALUE;
    for(a in algorithms)if (checked[a]) {
        rank[a] = (wtRank[a] + tatRank[a] + cpuUtilRank[a] + throughputRank[a] + rtRank[a]) / 5;
        if (rank[a] < minRank) minRank = rank[a];
    }
    for(a in algorithms)if (checked[a] && rank[a] === minRank) bestAlgo.push({
        algorithm: algorithms[a],
        cpu_util: (cpuUtil[a] * 100).toFixed(2) + " %",
        throughput: (throughput[a] * 100).toFixed(2) + " % (Process per unit time)",
        tat: tat[a].toFixed(2),
        wt: wt[a].toFixed(2),
        rt: rt[a].toFixed(2)
    });
}

//# sourceMappingURL=index.aa95be8d.js.map
