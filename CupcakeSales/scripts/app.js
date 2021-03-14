(() => {
    const isBetween = window.dayjs_plugin_isBetween;
    dayjs.extend(isBetween);

    class Orders {
        constructor(totalSales, basicCupcakeSold, deluxeCupcakeSold, date) {
            this.totalSales = totalSales;
            this.basicCupcakeSold = basicCupcakeSold;
            this.deluxeCupcakeSold = deluxeCupcakeSold;
            this.date = date;
        }

        totalSales() {
            return this.totalSales;
        }
        
        totalCupcakeSoldByType(type) {
            switch (type) {
                case 0:
                    return this.basicCupcakeSold;
                case 1:
                    return this.deluxeCupcakeSold;
            }
        }
            
        totalSalesByType(type) {
            switch (type) {
                case 0:
                    return this.basicCupcakeSold * 5;
                case 1:
                    return this.deluxeCupcakeSold * 6;
                case 2:
                    return this.totalSales - this.totalSalesByType(0) - this.totalSalesByType(1);
            }
        }
    }

    const orderItemTypeEnum = {
        basic: 0,
        deluxe: 1,
        other: 2
    };

    const fileInput = document.getElementById('cupcakes-file');
    let basic = [], deluxe = [], totals = [];
    let dailySales = [];

    function generateCupcakeData(files) {
        basic = [];
        deluxe = [];
        totals = [];
        dailySales = [];
        document.querySelector('.container').classList.add('is-hidden');

        if (files && files.length) {
            for (let index = 0; index < files.length; index++) {
                getFileContents(files[index]);
            }
        }
    }

    function getFileContents(file) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            const contents = event.target.result.split('\n');
            let currentSelection;

            contents.forEach(line => {
                if (!currentSelection) {
                    currentSelection = line;
                    return;
                }

                switch (currentSelection) {
                    case 'Basic Cupcake:':
                        basic.unshift(line);
                        break;
                    case 'Delux Cupcakes:':
                        deluxe.unshift(line);
                        break;
                    case 'Total:':
                        totals.unshift(line);
                        break;
                }
            });

            if (basic.length > 0 && deluxe.length > 0 && totals.length > 0) {
                workoutOrders();
                setUI();
                document.getElementById('cupcakes-file').value = "";
            }
        });
        reader.readAsText(file, 'UTF-8');
    }

    function workoutOrders() {
        const totalItems = basic.length;
        let date = dayjs();

        for (let index = 0; index < totalItems; index++) {
            const basicCount = parseInt(basic[index]);
            const deluxeCount = parseInt(deluxe[index]);
            const totalSales = parseInt(totals[index]);
            const order = new Orders(totalSales, basicCount, deluxeCount, date);

            dailySales.push(order);
            date = date.subtract(1, 'day');
        }
    }

    function getWeeklyRevenues() {
        return getRevenues('week');
    }
    
    function getMonthlyRevenues() {
        return getRevenues('month');
    }
    
    function getYearlyRevenues() {
        return getRevenues('year');
    }

    function getRevenues(dateType) {
        const revenues = [];
        let revenue;
        let date = dayjs();
        do {
            revenue = getRevenueBetweenDates(date.startOf(dateType), date.endOf(dateType));
            if (revenue.length === 0) {
                break;
            }

            revenues.push({
                date,
                revenue
            });
            date = date.subtract(1, dateType);
        } while (revenue.length > 0);

        return revenues;
    }

    function getRevenueBetweenDates(startDate, endDate) {
        return dailySales.filter(sales => {
            return sales.date.isBetween(startDate, endDate);
        });
    }

    function setUI() {
        const yearTable = document.querySelector('#yearTable tbody');
        const monthTable = document.querySelector('#monthTable tbody');
        const weekTable = document.querySelector('#weekTable tbody');

        const yearlyRevenues = getYearlyRevenues();
        const monthlyRevenues = getMonthlyRevenues();
        const weeklyRevenues = getWeeklyRevenues();

        yearlyRevenues.forEach(revenue => updateTable(yearTable, revenue));
        monthlyRevenues.forEach(revenue => updateTable(monthTable, revenue));
        weeklyRevenues.forEach(revenue => updateTable(weekTable, revenue));

        setBarGraph('yearChart', 
            yearlyRevenues.map(rev => rev.date.year()), 
            yearlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSales, 0)),
            yearlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.basic), 0)),
            yearlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.deluxe), 0))
        );
        setBarGraph('monthChart', 
            monthlyRevenues.map(rev => rev.date.format('MM/YYYY')), 
            monthlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSales, 0)),
            monthlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.basic), 0)),
            monthlyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.deluxe), 0))
        );
        setBarGraph('weekChart', 
            weeklyRevenues.map(rev => rev.date.format('D/MM/YYYY')), 
            weeklyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSales, 0)),
            weeklyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.basic), 0)),
            weeklyRevenues.map(rev => rev.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.deluxe), 0))
        );
        
        document.querySelector('.container.is-hidden').classList.remove('is-hidden');
        document.querySelector('.tabs a:first-child').click();
    }

    function setBarGraph(el, labels, totals, basic, deluxe) {
        var ctx = document.getElementById(el).getContext("2d");

        var data = {
          labels,
          datasets: [{
            label: "Total",
            backgroundColor: "blue",
            data: totals
          }, {
            label: "Basic",
            backgroundColor: "red",
            data: basic
          }, {
            label: "Deluxe",
            backgroundColor: "green",
            data: deluxe
          }]
        };
        
        var myBarChart = new Chart(ctx, {
          responsive: true,
          type: 'bar',
          data: data,
          options: {
            barValueSpacing: 20,
            scales: {
              yAxes: [{
                ticks: {
                  min: 0,
                }
              }]
            }
          }
        });
    }

    function updateTable(table, revenue) {
        const row = table.insertRow(0);
        let cell1 = row.insertCell(0), cell2 = row.insertCell(1), cell3 = row.insertCell(2), cell4 = row.insertCell(3);
        cell1.innerHTML = `<td>${revenue.date.format('DD/MM/YYYY')}</td>`;
        cell2.innerHTML = `<td>$${revenue.revenue.reduce((acc, revenue) => acc + revenue.totalSales, 0)}</td>`;
        cell3.innerHTML = `<td>
            ${revenue.revenue.reduce((acc, revenue) => acc + revenue.totalCupcakeSoldByType(orderItemTypeEnum.basic), 0)} /
            $${revenue.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.basic), 0)} 
        </td>`;
        cell4.innerHTML = `<td>
            ${revenue.revenue.reduce((acc, revenue) => acc + revenue.totalCupcakeSoldByType(orderItemTypeEnum.deluxe), 0)} /
            $${revenue.revenue.reduce((acc, revenue) => acc + revenue.totalSalesByType(orderItemTypeEnum.deluxe), 0)} 
        </td>`;
    }

    fileInput.addEventListener('change', (e) => generateCupcakeData(e.target.files));
        
    document.querySelectorAll('.tabs a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (document.querySelector('.tabs li.is-active')) {
                document.querySelector('.tabs li.is-active').classList.remove('is-active');
            }

            document.querySelectorAll('.container > div:not(.tabs)').forEach(el => el.classList.add('is-hidden'));
            e.target.parentElement.classList.add('is-active');
            document.querySelector(`.${e.target.dataset.type}`).classList.remove('is-hidden');
        });
    });
})();