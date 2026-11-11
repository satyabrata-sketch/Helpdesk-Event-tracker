const months = [
  { m: 'Jan-26', monthNum: 1, reactive: 42, proactive: 48, total: 90, closed: 90, open: 0 },
  { m: 'Feb-26', monthNum: 2, reactive: 41, proactive: 47, total: 88, closed: 88, open: 0 },
  { m: 'Mar-26', monthNum: 3, reactive: 48, proactive: 54, total: 102, closed: 102, open: 0 },
  { m: 'Apr-26', monthNum: 4, reactive: 45, proactive: 51, total: 96, closed: 96, open: 0 },
  { m: 'May-26', monthNum: 5, reactive: 43, proactive: 49, total: 92, closed: 92, open: 0 },
  { m: 'Jun-26', monthNum: 6, reactive: 44, proactive: 50, total: 94, closed: 94, open: 0 },
  { m: 'Jul-26', monthNum: 7, reactive: 49, proactive: 56, total: 105, closed: 105, open: 0 },
  { m: 'Aug-26', monthNum: 8, reactive: 46, proactive: 52, total: 98, closed: 98, open: 0 },
  { m: 'Sep-26', monthNum: 9, reactive: 47, proactive: 53, total: 100, closed: 100, open: 0 },
  { m: 'Oct-26', monthNum: 10, reactive: 44, proactive: 51, total: 95, closed: 95, open: 0 },
  { m: 'Nov-26', monthNum: 11, reactive: 40, proactive: 46, total: 86, closed: 85, open: 1 },
  { m: 'Dec-26', monthNum: 12, reactive: 38, proactive: 48, total: 85, closed: 84, open: 1 }
];

let sumTotal = 0;
let sumReactive = 0;
let sumProactive = 0;
let sumClosed = 0;
let sumOpen = 0;

for (const x of months) {
  sumTotal += x.total;
  sumReactive += x.reactive;
  sumProactive += x.proactive;
  sumClosed += x.closed;
  sumOpen += x.open;
}

console.log('sumTotal:', sumTotal);
console.log('sumReactive:', sumReactive);
console.log('sumProactive:', sumProactive);
console.log('sumClosed:', sumClosed);
console.log('sumOpen:', sumOpen);
console.log('Jul-26 value:', months.find(x => x.m === 'Jul-26').total);
