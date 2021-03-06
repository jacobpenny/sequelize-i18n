'use strict';

var should = require('chai').should();
var Sequelize = require('sequelize');
require('mocha');

var options = {
    db_name: 'test',
    user: 'root',
    password: 'root'
}

var languages = {
    list: ["FR", "EN", "ES"],
    default: "FR"
}

var sequelize;
var Model;
var i18n;
var instance;

describe('Utils methods', function () {

    var utils = require('../lib/utils');

    it('should return the i18n model name', function () {
        utils.getI18nName('test').should.equal('test_i18n');
    });

    it('toArray() of null should return an empty array', function () {
        var result = utils.toArray(null);
        Array.isArray(result).should.equal(true);
        result.length.should.equal(0);
    });

    it('toArray() of an empty array should return an empty array', function () {
        var result = utils.toArray([]);
        Array.isArray(result).should.equal(true);
        result.length.should.equal(0);
    });

    it('toArray() of an object should return an array containing the object at index 0', function () {
        var obj = 5;
        var result = utils.toArray(obj);
        Array.isArray(result).should.equal(true);
        result.length.should.equal(1);
        result[0].should.equal(obj);
    });

    it('getLanguageArrayType() of an array of strings should return "STRING" ', function () {
        var result = utils.getLanguageArrayType(['FR', 'EN']);
        result.should.equal("STRING");
    });

    it('getLanguageArrayType() of an array of numbers should return "INTEGER" ', function () {
        var result = utils.getLanguageArrayType([1, 2]);
        result.should.equal("INTEGER");
    });

    it('getLanguageArrayType() of an array of mixed object should return "STRING" ', function () {
        var result = utils.getLanguageArrayType(["1", 2]);
        result.should.equal("STRING");
    });
});

describe('Sequelize', function () {

    it('should be connected to database', function () {
        sequelize = new Sequelize(options.db_name, options.user, options.password, { logging : false });
    });

    it('should init i18n module', function () {
        var Sequelize_i18n = require('../index.js');
        i18n = new Sequelize_i18n(sequelize, { languages: languages.list, default_language: languages.default });
        i18n.init();
    });

    it('should add the given model', function () {
        Model = require('./model/model')(sequelize);
    });

    it('should have imported the exemple model', function () {
        sequelize.models.should.have.property('model');
    });

});

describe('Sequelize-i18n', function () {

    it('i18n should have the correct languages list', function () {

        i18n.languages.length.should.equal(languages.list.length);
        var is_equal = true;

        for (var i = 0; i < languages.list.length; i++) {
            i18n.languages[i].should.equal(languages.list[i]);
        }
    });

    it('i18n should have "' + languages.default + '" as default language', function () {
        i18n.default_language.should.equal(languages.default);
    });

    it('should have created the model i18n table', function () {
        sequelize.models.should.have.property('model_i18n');
    });

    it('should synchronize database', function (done) {
        sequelize.sync({ force: true })
            .then(function () {
                done();
            })
            .catch(function (error) {
                done(error);
            });
    });

    it('should have a "model" table', function (done) {
        sequelize.showAllSchemas()
            .then(function (result) {
                result.should.not.equal(null);
                result.length.should.equal(2);
                result[0].should.have.property('Tables_in_' + options.db_name);
                result[0]['Tables_in_' + options.db_name].should.equal('model');
                done();
            })
    });

    it('should have a "model_i18ns" table', function (done) {
        sequelize.showAllSchemas()
            .then(function (result) {
                result.should.not.equal(null);
                result.length.should.equal(2);
                result[1].should.have.property('Tables_in_' + options.db_name);
                result[1]['Tables_in_' + options.db_name].should.equal('model_i18ns');
                done();
            })
    });
});

describe('Sequelize-i18n create', function () {
    it('should return the created model with the i18n property', function (done) {
        Model.create({
            id: 1,
            name: 'test',
            reference: "xxx"
        })
            .then(function (result)  {
                if (result) {
                    instance = result;
                    return done();
                }
            })
            .catch(function (error) {
                done(error);
            })
    });
});

describe('Sequelize-i18n find', function () {
    it('should return i18n values', function () {
        instance.should.have.property('model_i18n');
        instance['model_i18n'].length.should.equal(1);
        instance['model_i18n'][0].should.have.property('name');
        instance['model_i18n'][0]['name'].should.equal("test");
    });
});

describe('Sequelize-i18n update', function () {
    it('should set the name property to test2 for default language', function (done) {
        instance.update( { name: "test-fr-update" } , { language_id : "FR" } ).then( function ( res ) {
            instance.get_i18n("FR").name.should.equal('test-fr-update');
            done();
        })
    });

    it('should set the name property to test-en-update for EN', function (done) {
        instance.update( { name: "test-en-update" }, { language_id : "EN" } ).then( function( res ) {
            Model.find( { where: { id: 1 } } )
            .then(function (_result) {
                _result.get_i18n("EN").name.should.equal('test-en-update');
                done();
            })
        })
    });
});


describe('Sequelize-i18n delete', function () {
    it('should delete current instance and its i18n values', function () {
        instance.destroy()
        .then( function( ) {
            done();
        });
        
    });
});
