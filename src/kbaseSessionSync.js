(function($) {
'use strict';
  var SessionSync = Object.create({}, {
    init: {
      value: function (cfg) {
        this.refreshSession();
        return this;
      }
    },
    
    session: {
      value: null,
      writable: true
    },
    sessionObject: {
      value: null,
      writable: true
    },
    cookieName: {
      value: 'kbase_session'
    },
    narrCookieName: {
      value: 'kbase_narr_session'
    },
    
    // Note that THIS session just uses the original kbase
    // session object without transforming it to the canonical form
    // used in the real kbaseSession
    getKBaseSession: {
      value: function () {
        return this.refreshSession();
      }
    },
   
    refreshSession: {
      value: function () {
        if (this.sessionChanged()) {
          this.sessionObject = this.importSessionFromCookie();
        }
        if (this.sessionObject && this.isExpired()) {
          this.removeAuth();
          this.sessionObject = null;
        }
        return this.sessionObject;
      }
    },
    
    sessionChanged: {
      value: function ()  {
        var sessionCookie = $.cookie(this.cookieName);
        if (this.sessionCookie === sessionCookie) {
          return false;
        } else {
          return true;
        }
      }
    },
    
    importSessionFromCookie: {
      value: function () {
        var sessionCookie = $.cookie(this.cookieName);

        if (!sessionCookie) {
          return null;
        }
        // first pass just break out the string into fields.
        var session = this.decodeToken(sessionCookie);
        
        session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');

        // now we have a session object equivalent to the one returned by the auth service.
        
        session.tokenObject = this.decodeToken(session.token);
        
        if (!this.validateSessionObject(session)) {
          // zap cookies if we had a bad cookie.
          this.removeAuth();
          return null;
        }

        var storageSession = localStorage.getItem(this.cookieName);
        if (!storageSession) {
          console.log('WARNING: Local Storage Cookie missing -- resetting session');
          this.removeAuth();
          return null;
        } 
        
        if (session.token !== storageSession.token) {
          console.log('WARNING: Local Storage Cookie auth different than cookie -- resetting session');
          this.removeAuth();
          return null;          
        }
        
        return session;
      }
    },
    decodeToken: {
      value: function (token) {
        var parts = token.split('|');
        var map = {};
        for (var i=0; i<parts.length; i++) {
          var fieldParts = parts[i].split('=');
          var key = fieldParts[0];
          var value = fieldParts[1];
          map[key] = value;
        }
        return map;
      }
    },
    decodeSessionString: {
      value: function (s) {
        if (!s || s.length === 0) {
          return null;
        }        
        var session = this.decodeToken(s);
        if (!session) {
          return null;
        }
        if (! (session.kbase_sessionid && session.un && session.user_id && session.token) ) {
          // In all probability, we have have the cookie created by the auth server.
          this.removeAuth();
          return null
        }
        session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');
        session.tokenObject = this.decodeToken(session.token);
        return session;
      }
    },
    
    validateSessionObject: {
      value: function (sessionObject) {
        if (!sessionObject) {
          return false;
        }
        // Validate the structure.
        if (! (sessionObject.kbase_sessionid && sessionObject.un && sessionObject.user_id && sessionObject.token && sessionObject.tokenObject) ) {
          return false;
        }
        return true;
      }
    },
    
    isExpired : {
      value: function () {          
          var expirySec = this.sessionObject.tokenObject.expiry;
          if (!expirySec) {
            return false;
          }
          expirySec = parseInt(expirySec);
          if (isNaN(expirySec)) {
            return false;
          }
          var expiryDate = new Date(expirySec*1000);
          var diff = expiryDate - new Date();
          if (diff <= 0) {
            return true;
          } else {
            return false;
          }
        }
    },
    removeAuth: {
      value: function() {
        $.removeCookie(this.cookieName, {path: '/'});
        $.removeCookie(this.cookieName, {path: '/', domain: 'kbase.us'});
        $.removeCookie(this.narrCookieName, {path: '/', domain: 'kbase.us'});
        // For compatability
        localStorage.removeItem(this.cookieName);
      }
    }
    
  });
  $.KBaseSessionSync = SessionSync.init();
}(jQuery));