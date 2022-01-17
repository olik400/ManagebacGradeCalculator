jQuery(document).ready(function() {
    //console.log("ready");
    chrome.storage.sync.get(['settings'], function(result) {
        settings = result.settings;

        if ("settings" in result == false) {
            settings = {ac: true, cc: true, im: true, pe: true, gc: true, ca: "pw", pc: false};
        };

        if(settings.gc) {
            //console.log("nice");
            clearInterval(checkExist);

            var categories = []; //category array

            //console.log(categories)

            var studentClass = $('.content-block-header h3').text();
            var studentClass1 = studentClass;

            function loadPage() {
                let currentClass = window.location.toString().replace(new RegExp('.*' + "classes/"), '').replace(/\D/g, "");
                //console.log("Current Class = " + currentClass)

                //create tableDiv if it does not exist
                //all the custom stuff is in table div
                var tableDiv

                function createTableDiv() {
                    tableDiv = document.createElement('div');
                    tableDiv.id = "tableDiv";
                    $('.content-block').append(tableDiv);
                    tableDiv.setAttribute("displayingClass", currentClass);
                    tableDiv.style.padding = "15px 0px";
                }
                if ($('#tableDiv').length == 0) {
                    createTableDiv()
                };
                
                if (tableDiv) {
                        if ($('.highcharts-axis').length && $('#result').length == 0) {
                            clearInterval(checkExist);
                            //console.log("Exists!");
                            calculate();
                            $('#calculateButton').click();
                        } else if ($('.highcharts-axis').length && $('#result').length && studentClass !== studentClass1) {
                            clearInterval(checkExist);
                            $('#calculateButton').click();
                        }
                };

            };

            var checkExist = setInterval(loadPage, 500)

            let blueSum =0; //4 categories per assigement grading system
            let assigements =0; //4 categories per assigement grading system
            function calculate() {

                //check if grade calculated by MB
                let mbCalculated;
                $('.table tbody tr').each(function(i) {
                    if ($(this).children().first().text().indexOf('Overall') > -1) {
                        mbCalculated = true;
                    }
                })
                //Creates categories
                if (mbCalculated) { //older, different version of managebac (probably not used anymore)
                    $('.table tbody tr').each(function(i) {
                        if ($(this).children().first().text().indexOf('Overall') < 0) {
                            var cat = {} //category object
                            var title = $(this).children().first().text();
                            cat.name = title.slice(0, -5); //gets category name
                            cat.weight = Number(title.substr(title.length - 5).replace(/[^0-9.]/g, "")); //gets category weight
                            cat.grades = getGrade(cat.name) //gets category gradesid.substr(id.length - 5);
                            cat.avg = getAvg(cat.grades) //gets avarage of category
                            cat.specialNum = cat.avg * cat.weight / 100; //creates the number for §uclating the final grade
                            categories.push(cat) //puts category into array
                        }
                    })
                } else if($('.label-blue').length) { //4 categories per assigement grading system (no weights)
                    blueSum +=1; //prevent error when no assigement yet...
                    $('.label-blue').each(function(i) {
                        if($.isNumeric($(this).html())) {
                            blueSum += parseInt($(this).html(), 10);
                            assigements += 1;
                        }
                    })
                } else if($('.sidebar-items-list').length) { //Standard most precise search alogorithm
                    $('.sidebar-items-list .list-item:not(.list-item-head)').each(function(i) { //most current version
                        var cat = {} //category object
                        cat.name = $(this).children().first().text().replace(/(\r\n|\n|\r)/gm, "");; //gets category name + remove new lines
                        cat.weight = Number($(this).children().eq(1).text().replace(/[^0-9]+/g, '')); //gets category weight
                        cat.grades = getGrade(cat.name) //gets category grades
                        cat.avg = getAvg(cat.grades) //gets avarage of category
                        cat.specialNum = cat.avg * cat.weight / 100; //creates the number for caluclating the final grade
                        categories.push(cat) //puts category into array
                    })
                } else { //More universal search algorithm
                    const perts = $('section :contains("%")').filter(function() { return $(this).children().length === 0;});

                    for(let i=0; i<perts.length; i++) {
                        var cat = {} //category object
                        cat.name = $(perts[i]).parent().find('.label').text() //gets category name
                        cat.weight = Number($(perts[i]).text().replace(/[^0-9]+/g, '')); //gets category weight
                        cat.grades = getGrade(cat.name) //gets category grades
                        cat.avg = getAvg(cat.grades) //gets avarage of category
                        cat.specialNum = cat.avg * cat.weight / 100; //creates the number for caluclating the final grade
                        categories.push(cat) //puts category into array
                    } 
                }

                //gets category grades
                function getGrade(cat) {
                    var grades = [];
                    
                    $('.tasks-list-container').find(".label:contains(" + cat + ")").each(function(i) {
                        var a = $(this).parentsUntil('.tasks-list-container').last().find(".points").text()
                        var b = a.split('/').map(function(item) {
                            return parseInt(item, 10);
                        });
                        if (b[0] > -1) {
                            let grade = Math.round(b[0] / b[1] * 100 * 100) / 100
                            grades.push(grade);

                            if (settings.pc) {
                                $(this).parentsUntil('.tasks-list-container').last().find(".grade").text(String(grade) + "%")
                            };
                        }

                    })

                    return grades;
                }

                //creates a avarage from array
                function getAvg(grades) {
                    var sum = 0;
                    for (var i = 0; i < grades.length; i++) {
                        sum += parseInt(grades[i], 10);
                    }
                    return sum / grades.length;
                }

                //calculates the final result
                function fresult() {
                    var sumWeight = 0;
                    var sumSpecial = 0;
                    for (var i = 0; i < categories.length; i++) {
                        if (isNaN(categories[i].avg)) { //checks if category has some grades in it
                            //console.log("NAN" + categories[i].name);
                        } else {
                            sumWeight += categories[i].weight;
                        }
                    }
                    for (var i = 0; i < categories.length; i++) {
                        if (isNaN(categories[i].avg)) {
                            //console.log("NAN" + categories[i].name);
                        } else {
                            sumSpecial += categories[i].specialNum;
                        }
                    }
                    let finalGrade = Math.round(sumSpecial / sumWeight * 1000) / 10;
                    if(isNaN(finalGrade)) {
                        finalGrade = "An error has occured or you are using an unsupported grade system. Please contact the developer (13skarupa@opengate.cz). Switch off grade calculation in the settings to use the other features";
                    }
                    return finalGrade + "%";
                }

                //This creates the red result
                var result = document.createElement('h3');
                result.style.color = "red";
                result.style.marginTop = "10px";
                result.style.float = "right";
                result.id = "result";
                if(blueSum === 0) {
                    let res = fresult();
                    $('.page-head-tile').find('h3').each(function() {
                        this.innerHTML = "Final Grade: " + res;
                    });
                    result.innerHTML = "Grade: " + res;
                } else {
                    result.innerHTML = "Average points per assigement: " + Math.round(((blueSum-1) / (assigements / 4)) * 100) / 100;
                }
                $('#divTable').append(result);


                //The code that creates the table in the bottom (mix of jQuery and default javascript -_-)
                var body = $('main').children().last().children();
                var info = document.createElement('h4');
                info.innerHTML = "You can change the grades in this table and calculate your grade again:";

                var tbl = document.createElement('table');
                tbl.setAttribute('id', 'gradeChart');
                tbl.setAttribute('border', '1');
                tbl.style.margin = '20px 0px';
                var tbdy = document.createElement('tbody');

                if(blueSum < 1) {
                    tableDiv.append(info);
                    tbl.append(tbdy);
                    tableDiv.append(tbl);
                }
                for (var i = 0; i < categories.length; i++) {
                    $('#gradeChart > tbody:last-child').append('<tr id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + 'tr"><td style="padding: 5px;">' + categories[i].name + '</td><td style="padding: 5px;">' + categories[i].weight + '%</td></tr>');

                    for (var k = 0; k < categories[i].grades.length; k++) {
                        $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><input class="gradeInput' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '" style="width:40px" value="' + categories[i].grades[k] + '"></td>')
                        if (k == categories[i].grades.length - 1) {
                            //$('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><input class="gradeInput' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '" style="width:40px"></td>')
                            $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><button class="plus" id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '">+</button></td>')

                        }
                    }
                    if (categories[i].grades.length == 0) {
                        $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><button class="plus" id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '">+</button></td>')
                    }
                }

                $('#gradeChart').on("click", ".plus", function() {
                    $('#' + this.id + 'tr td:last').before('<td style="padding: 5px;"><input class="gradeInput' + this.id + '" style="width:40px"></td>');
                });

                var but = document.createElement('button');
                var text = document.createTextNode("Calculate");
                but.setAttribute('id', 'calculateButton');
                but.append(text);
                tableDiv.append(but);

                $('#calculateButton').click(function() {
                    gradeTableToObject();
                    $('#result2').remove();
                    $('#tableDiv').append('<h2 id="result2">Grade: ' + fresult() + '</h2>')
                });

                //creates the categories from the table to calculate the final grade
                function gradeTableToObject() {
                    categories = [];
                    $('#gradeChart tbody tr').each(function(i) {
                        var cat = {};
                        cat.name = $(this).children().first().text();
                        cat.weight = Number($(this).children().eq(1).text().replace(/[^0-9]+/g, ""));
                        cat.grades = getGrade1(cat.name)
                        cat.avg = getAvg(cat.grades)
                        cat.specialNum = cat.avg * cat.weight / 100;
                        categories.push(cat);
                    })
                }

                //gets grades from table
                function getGrade1(name) {
                    var grades = [];
                    $('.gradeInput' + name.replace(/[^a-z0-9]/gi, '')).each(function(i) {
                        if ($(this).val() != '') {
                            grades.push($(this).val())
                        }
                    })
                    return grades;
                }
            }

            var school = $(".school-name").text();
            chrome.runtime.sendMessage({
                whatSchool: school
            });
        }
    });
    

});