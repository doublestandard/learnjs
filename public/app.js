'use strict';
function googleSingIn(googleUser){
    var id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins:{
                'accounts.google.com' : id_token
            }
        })
    })

    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then (function(userUpdate){
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse.id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh;
        });
    }

    learnjs.awsRefresh().then(function(id){
        learnjs.identity.resolve({
            id:id,
            email:googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        });
    });
}

var learnjs = {
    poolId : 'us-east-1:0ebaad82-8457-4609-a1a9-cefd97d308ea'
};

learnjs.awsRefresh = function(){
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function(err){
        if(err){
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
}

learnjs.identity = new $.Deferred();

learnjs.programs = [
    {description:"What is truth?",
    code :"function problem(){return  __}"},
    {description:"Simple Math",
        code :"function problem(){return  42 === 6 * __}"}
];

learnjs.applyObject = function(obj,elem){
    for(var key in obj){
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
};
learnjs.problemView = function(data){
    var programNumber = parseInt(data,10);
    var view = learnjs.template('problem-view');
    var programData = learnjs.programs[programNumber - 1];
    var resultFlash = view.find('.result');

    function checkAnswer(){
        var answer = view.find('.answer').val();
        var test = programData.code.replace('__',answer) + '; problem();';
        return eval(test);
    }

    function checkAnswerClick(){
        if(checkAnswer()){
            var correctFlash = learnjs.buildCorrectFlash(programNumber);
            learnjs.flashElement(resultFlash,correctFlash);
        } else {
            learnjs.flashElement(resultFlash,'Incorrect!');
        }
        return false;
    }

    view.find('.check-btn').click(checkAnswerClick)
    view.find('.title').text('Problem #' + programNumber)
    learnjs.applyObject(programData,view);

    if(programNumber < learnjs.programs.length){
        var buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href','#problem-' + (programNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView',function(){
            buttonItem.remove();
        });
    }
    return  view;
}
learnjs.showView = function(hash){
    var routes = {
        '#problem' : learnjs.problemView,
        '#':learnjs.landingView,
        '':learnjs.landingView
    };
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if(viewFn){
        learnjs.triggerEvent('removingView',[]);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}

learnjs.appOnReady = function(){
    window.onhashchange = function(){
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
}

learnjs.flashElement = function(elem,content){
    elem.fadeOut('fast',function(){
        elem.html(content);
        elem.fadeIn();
    });
}

learnjs.template = function(name){
    return $('.templates .' + name).clone();
}

learnjs.buildCorrectFlash = function (programNum){
    var correctFlash = learnjs.template('correct-flash');
    var link =  correctFlash.find('a');
    if(programNum < learnjs.programs.length){
        link.attr('href','#problem-' + (programNum + 1));
    } else {
         link.attr('href','');
         link.text("You're Finished!")
    }
    return correctFlash;
}

learnjs.landingView = function () {
    return learnjs.template('landing-view');
}

learnjs.triggerEvent = function(name,args){
    $('.view-container>*').trigger(name,args);
}