const express = require('express')
const app = express()
const port = 3000
const sql = require('mssql/msnodesqlv8')
const path = require('path');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const fs = require('fs')

app.use(bodyParser.urlencoded({ extended: true }));

const pool = new sql.ConnectionPool({
  database: 'Enrolment',
  server: 'ZTEN-5\\SQLEXPRESS',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true
  }
})

// pool.connect().then(() => {
//     //simple query
//     pool.request().query('select * from course', (err, result) => {
//           console.dir(result)
//       })
//   })


app.get('/', (req, res) => {
	const sql = "select * from course"// 개설강좌
    const sql1 = `select c.crsCode, c.subArea, c.year, c.crsNum, c.subName, c.grade, c.prName, c.crsTime, c.room
                from student as a
                inner join sugang as b on a.num = b.num
                inner join course as c on b.crsCode = c.crsCode where a.num = 's1'`// 신청내역
    const sql2 = `select distinct * from(
       select 
       a.crsCode, 
       a.subArea, 
       a.year, 
       a.crsNum, 
       a.subName, 
       a.grade, 
       a.prName, 
       a.crsTime, 
       a.room,
       b.week, 
       b.starttime,
       b.finishtime
       from course as a 
       full outer join weekTable as b on a.crsCode = b.crsCode 
    )as a
    cross join (
       select 
       a.crsCode, 
       a.num,
       b.week, 
       b.starttime,
       b.finishtime
       from sugang as a
       inner join weekTable as b on a.crsCode = b.crsCode
       where num = 's1'
    ) as b
    where ISNULL(b.week,'') != a.week
    and convert(float, iif(isnull(a.starttime, '0.0') = '', '0.0', isnull(a.starttime, '0.0')) ) 
       > convert(float, iif(isnull(b.starttime, '0.0') = '', '0.0', isnull(b.starttime, '0.0')))
    and convert(float, iif(isnull(a.finishtime, '0.0') = '', '0.0', isnull(a.finishtime, '0.0')) ) 
       < convert(float, iif(isnull(b.finishtime, '0.0') = '', '0.0', isnull(b.finishtime, '0.0')) )
    order by a.week` // 남은과목보기

    console.log("start")
    let courseArr = []
    let studentArr = []
    let weekArr = []
    pool.connect().then(() => {
        pool.request().query(sql + ";" + sql1 + ";" + sql2, function(err, result, fields){
            if (err) throw err;
            courseArr = result.recordsets[0]
            studentArr = result.recordsets[1]
            weekArr = result.recordsets[2]
            var page = ejs.render(fs.readFileSync('./views/index.ejs', 'utf8'), {
                course: courseArr,
                student: studentArr,
                week: weekArr
            });
            res.send(page);
        })
    })
});


app.listen(port, () => console.log(path.join(__dirname, 'html','form.html')))