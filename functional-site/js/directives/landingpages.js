
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('lp-directives', []);
angular.module('lp-directives')
.directive('objectlist', function($location) {
    return {
        link: function(scope, element, attr) {
            if (scope.type == 'models') {
                var ws = scope.ws ? scope.ws : "KBaseCDMModels";

                var p = $(element).kbasePanel({title: 'KBase Models', 
                                                   rightLabel: ws});
                p.loading();
                var prom = kb.req('ws', 'list_workspace_objects',
                                    {type: 'Model', workspace: ws})
                $.when(prom).done(function(d){
                    $(p.body()).kbaseWSModelTable({ws: ws, data: d});
                    $(document).on('modelClick', function(e, data) {
                        var url = '/models/'+ws+'/'+data.id;
                        scope.$apply( $location.path(url) );
                    });
                })
            } else if (scope.type == 'media') {
                var ws = scope.ws ? scope.ws : "KBaseMedia"; 

                var p = $(element).kbasePanel({title: 'KBase Media', 
                                                   rightLabel: ws});
                p.loading();
                var prom = kb.req('ws', 'list_workspace_objects',
                                    {type: 'Media', workspace: ws});

                $.when(prom).done(function(d){
                    $(element).kbaseWSMediaTable({ws: ws, data: d});
                    $(document).on('mediaClick', function(e, data) {
                        var url = '/media/'+ws+'/'+data.id;
                        scope.$apply( $location.path(url) );
                    });
                })
            } else if (scope.type == 'rxns') {
                var p = $(element).kbasePanel({title: 'Biochemistry Reactions'});
                p.loading();

                var bioTable = $(p.body()).kbaseBioRxnTable(); 

                var prom = getBio('rxns', p.body(), function(data) {
                    bioTable.loadTable(data);
                });
            } else if (scope.type == 'cpds') {
                var p = $(element).kbasePanel({title: 'Biochemistry Compounds'});
                p.loading();

                var bioTable = $(p.body()).kbaseBioCpdTable();

                var prom = getBio('cpds', p.body(), function(data) {
                    bioTable.loadTable(data);
                });
            }
        }
        
    };
})
.directive('memelist', function($location) {
    return {
        link: function(scope, element, attr) {
            var ws = scope.ws ? scope.ws : "AKtest"; 

            $(element).kbaseMemeTable({ws: ws, auth: scope.USER_TOKEN, userId: scope.USER_ID});
            $(document).on('memeClick', function(e, data) {
                var url = '/meme/'+ws+'/'+data.id;
                scope.$apply( $location.path(url) );
            });
        }
        
    };
})
.directive('modelmeta', function() {
    return {
        link: function(scope, element, attrs) {
            var p = $(element).kbasePanel({title: 'Model Info', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();

            var prom = kb.req('ws', 'get_objectmeta',
                        {type:'Model', id: scope.id, workspace: scope.ws});
            $.when(prom).done(function(data){
                $(p.body()).kbaseModelMeta({data: data});
            })
        }
    };
})
.directive('modeltabs', function($location, $rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var ws = scope.ws;
            var id = scope.id;
            /*var p = $(element).kbasePanel({title: 'Model Details', 
                                           rightLabel: ws ,
                                           subText: id,
                                           type: 'FBAModel', 
                                           widget: 'modeltabs'});
                */
            $(ele).loading();

            //var prom = kb.req('fba', 'get_models',
            //            {models: [id], workspaces: [ws]});

            var prom = kb.get_model(scope.ws, scope.id)
            $.when(prom).done(function(data){
                $(ele).rmLoading();

                $rootScope.org_name = data[0].data.name;
                scope.$apply();

                $(ele).kbaseModelTabs({modelsData: data, api: kb.fba, ws: ws});
                $(document).on('rxnClick', function(e, data) {
                    var url = '/rxns/'+data.ids;
                    scope.$apply( $location.path(url) );
                });
                $(document).on('cpdClick', function(e, data) {
                    var url = '/cpds/'+data.ids;
                    scope.$apply( $location.path(url) );
                });                 
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });
        }
    };
})
.directive('modelcore', function($location) {
    return {
        link: function(scope, element, attrs) {
            var ws = scope.ws;
            var id = scope.id;
            var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                           rightLabel: ws,
                                           subText: id, 
                                           type: 'FBAModel', 
                                           widget: 'modelcore'});
            p.loading();

            var prom = kb.req('fba', 'get_models',
                        {models: [id], workspaces: [ws]})
            $.when(prom).done(function(data) {
                $(p.body()).kbaseModelCore({ids: [id], 
                                            workspaces : [ws],
                                            modelsData: data});
                $(document).on('coreRxnClick', function(e, data) {
                    var url = '/rxns/'+data.ids.join('&');
                    scope.$apply( $location.path(url) );
                });  
            })
        }
    };
})
.directive('modelopts', function() {
    return {
        link: function(scope, element, attrs) {
            $(element).kbaseModelOpts({ids: scope.id, 
                                       workspaces : scope.ws})
        }
    };
})
.directive('fbameta', function() {
    return {
        link: function(scope, element, attrs) {
            var p = $(element).kbasePanel({title: 'FBA Info', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            var prom = kb.req('ws', 'get_objectmeta',
                        {type:'FBA', id: scope.id, workspace: scope.ws});
            $.when(prom).done(function(data){
                $(p.body()).kbaseFbaMeta({data: data});                    
            });
        }
    };
})
.directive('fbatabs', function($location, $rootScope, $stateParams) {
    return {
        link: function(scope, element, attrs) {
            $(element).loading();
            
            $.when(scope.ref_obj_prom).done(function() {
                loadPanel(scope.fba_refs)

            }).fail(function() {
                $(element).html("<h5>There are currently no FBA \
                                    results associated with this model.\
                                      You may want to run FBA analysis.</h5>")
            })

            function loadPanel(fba_refs) {
                var ver_selector = $('<select class="form-control fba-selector">');
                for (var i in fba_refs) {
                    var ref = fba_refs[i];

                    if ($stateParams.fba == ref.name) {
                        ver_selector.append('<option data-name="'+ref.name+'" data-ws="'+ref.ws+'" selected>'
                                                +ref.name+' | '+ref.ws+' | '+ref.date+'</option>')
                    } else {
                        ver_selector.append('<option data-name="'+ref.name+'" data-ws="'+ref.ws+'">'
                                                +ref.name+' | '+ref.ws+' | '+ref.date+'</option>')                        
                    }
                }

                // set url query string to first 
                //$location.search({fba: fba_refs[0].name});

                // reload table when 
                ver_selector.change(function() {
                    var gif_container = $('<div>');
                    $(this).after(gif_container)
                    gif_container.loading();

                    var selected = $(this).find('option:selected')
                    var name = selected.data('name');
                    var ws = selected.data('ws');                    

                    //scope.$apply( $location.search({fba: ws+'/'+name}) ); 
                    loadTabs(ws, name)                                
                })

                // form for options on tabs
                var form = $('<div class="col-xs-5">');
                form.append(ver_selector)
                var row = $('<div class="row">');
                row.append(form)

                $(element).prepend(row)

                loadTabs(fba_refs[0].ws, fba_refs[0].name)
            }


            function loadTabs(fba_ws, fba_name) {
                console.log('loading tabs for', fba_ws, fba_name)
                var p1 = kb.get_fba(fba_ws, fba_name)
                //var p2 = kb.ws.get_object_info([{workspace: fba_refs[0].ws, 
                //                                 name: fba_refs[0].name}], 1);
                $.when(p1).done(function(data){
                    $(element).rmLoading();

                    $('.fba-container').remove();
                    var container = $('<div class="fba-container">');
                    $(element).append(container);
                    container.kbaseFbaTabs({fbaData: data});

                    $rootScope.org_name = data[0].org_name;
                    scope.$apply();

                    $(document).on('rxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });        
                    $(document).on('cpdClick', function(e, data) {
                        var url = '/cpds/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });                            
                })
            }



        } /* end link */
    };
})
.directive('associatedmodel', function($compile) {
    return {
        link: function(scope, ele, attrs) {
            // fixme: this just needs to be rewritten
            var fba_id = scope.id;

            $(ele).loading();
            var prom = kb.get_fba(scope.ws, scope.id);
            $.when(prom).done(function(data) {

                var refs = data[0].refs

                var obj_refs = []
                for (var i in refs) {
                    obj_refs.push({ref: refs[i]})
                }
                var p = kb.ws.get_object_info(obj_refs)

                $.when(p).done(function() {
                    var reference_list = arguments[0]

                    for (var i in reference_list) {
                        var info = reference_list[i];
                        var full_type = info[2];
                        var type = full_type.slice(full_type.indexOf('.')+1);
                        var kind = type.split('-')[0];

                        if (kind == "FBAModel") {
                            var ws = info[7];
                            var id = info[1];
                            break;
                        }
                    }

                    var url = 'ws.mv.fba'+"({ws:'"+ws+"', id:'"+id+"', fba:'"+fba_id+"'})";
                    var link = $('<h5><a ui-sref="'+url+'">'+fba_id+'</a></h5>');
                    $compile(link)(scope);
                    $(ele).append(link)

                    $(ele).append('<br><br>')
                    $(ele).append('<h5>Referenced Objects</h5>')

                    var data = [];
                    var labels = []
                    $(ele).rmLoading();
                    for (var i in reference_list) {
                        var info = reference_list[i]
                        var full_type = info[2];

                        var ws = info[7]
                        var id = info[1]
                        var module = full_type.split('.')[0];
                        var type = full_type.slice(full_type.indexOf('.')+1);
                        var kind = type.split('-')[0];

                        switch (kind) {
                            case 'FBA': 
                                route = 'ws.fbas';
                                break;
                            case 'FBAModel': 
                                route = 'ws.mv.model';
                                break;
                            case 'Media': 
                                route = 'ws.media';
                                break;
                            case 'MetabolicMap': 
                                route = 'ws.maps';
                                break;
                            case 'Media': 
                                route = 'ws.media';
                                break; 
                        }


                        var url = route+"({ws:'"+ws+"', id:'"+id+"'})";
                        var link = '<a ui-sref="'+url+'">'+id+'</a>'
                        data.push(link)
                        labels.push(kind)
                    }

                    var table = kb.ui.listTable('referenced-objects', data, labels)
                    $compile(table)(scope);
                    $(ele).append(table)
                    //scope.$apply();
                        //$compile(link)(scope);
                        //var row = $('<div>')
                        //row.append('<b>'+kind+'</b>: ')
                        //row.append(link)
//
                        //$(ele).append(row);


                })

            })

        }
    }
})
.directive('fbacore', function($location) {
    return {
        link: function(scope, element, attrs) {
            var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                           rightLabel: scope.ws,
                                           subText: scope.id, 
                                           type: 'FBA', 
                                           widget: 'fbacore'});
            p.loading();

            var prom1 = kb.req('fba', 'get_fbas',
                        {fbas: [scope.id], workspaces: [scope.ws]});
            $.when(prom1).done(function(fbas_data) {
                var model_ref = fbas_data[0].modelref;
                var wsid = parseInt(model_ref.split('/')[0]);
                var objid = parseInt(model_ref.split('/')[1]);

                var prom2 = kb.req('fba', 'get_models',
                        {models: [objid], workspaces: [wsid]});
                $.when(prom2).done(function(models_data){
                    $(p.body()).kbaseModelCore({ids: [scope.id],
                                                workspaces : [scope.ws],
                                                modelsData: models_data,
                                                fbasData: fbas_data});
                    $(document).on('coreRxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids.join('&');
                        scope.$apply( $location.path(url) );
                    }); 
                })
            })
        }
    };
})


.directive('fbapathways', function($location) {
    return {
        link: function(scope, element, attrs) {
            var map_ws = 'nconrad:paths';
            var p = $(element).kbasePanel({title: 'Pathways', 
                                           type: 'Pathway',
                                           rightLabel: map_ws,
                                           subText: scope.id});
            p.loading();

            var prom1 = kb.get_models(scope.ws, scope.id);
            $.when(prom1).done(function(fbas_data) {
                $(p.body()).pathways({fbaData: fbas_data, 
                            ws: map_ws, defaultMap: scope.defaultMap,
                            scope: scope})

            }).fail(function(e){
                    $(p.body()).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });
        } //end link
    }
})

.directive('pathway', function() {
    return {
        link: function(scope, element, attrs) {
            var p = $(element).kbasePanel({title: 'Metabolic Pathway', 
                                           type: 'Pathway',
                                           rightLabel: 'N/A',
                                           subText: scope.id});
            p.loading();
            var p1 = kb.req('ws', 'get_objects',
                        [{name: scope.id, workspace: scope.ws}]);
            $.when(p1).done(function(d) {
                var d = d[0].data;
                $(p.body()).kbasePathway({ws: scope.ws,
                                          mapID: scope.id, 
                                          mapData: d, 
                                          editable:true})
            }).fail(function(e){
                    $(p.body()).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>');
            });

        }
    };
})    

.directive('mediadetail', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Media Details', 
                                           type: 'Media',
                                           rightLabel: scope.ws,
                                           subText: scope.id,
                                           widget: 'mediadetail'});
            p.loading();

            var prom = kb.req('fba', 'get_media',
                    {medias: [scope.id], workspaces: [scope.ws]})
            //var prom = kb.ws.get_objects([{workspace:scope.ws, name: scope.id}])
            $.when(prom).done(function(data) {
                $(p.body()).kbaseMediaEditor({ids: [scope.id], 
                                              workspaces : [scope.ws],
                                              data: data});
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });
        }
    };
})


.directive('phenotype', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Phenotype Set Data', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});

            $(p.body()).kbasePhenotypeSet({ws: scope.ws, name: scope.id})

        }
    }
})

.directive('promconstraint', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'PROM Constraint Data', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});

            $(p.body()).kbasePromConstraint({ws: scope.ws, name: scope.id})

        }
    }
})

.directive('regulome', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Regulome Data', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});

            $(p.body()).kbaseRegulome({ws: scope.ws, name: scope.id})

        }
    }
})

.directive('expressionseries', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Expression Series', 
                                           rightLabel: scope.ws,
                                           subText: scope.id});

            $(p.body()).kbaseExpressionSeries({ws: scope.ws, name: scope.id})

        }
    }
})

.directive('pangenome', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Pangenome ', 
                                       rightLabel: scope.ws,
                                       subText: scope.id});

            p.loading();
            $(p.body()).kbasePanGenome({ws: scope.ws, name:scope.id});
    

        }
    };
})

.directive('simulation', function() {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Simulation Set Data', 
                                       rightLabel: scope.ws,
                                       subText: scope.id});
            p.loading();
            $(p.body()).kbaseSimulationSet({ws: scope.ws, name: scope.id})
        }
    };
})


.directive('rxndetail', function() {
    return {
        link: function(scope, ele, attrs) {
            $(ele).loading()
            var prom = kb.req('fba', 'get_reactions',
                        {reactions: scope.ids})
            $.when(prom).done(function(data){
                $(ele).rmLoading();
                $(ele).kbaseRxn({data: data, ids: scope.ids});
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });
        }
    };
})
.directive('cpddetail', function() {
    return {
        link: function(scope, ele, attrs) {
            $(ele).loading()
            var prom = kb.req('fba', 'get_compounds',
                        {compounds: scope.ids});

            $.when(prom).done(function(data){
                $(ele).rmLoading();                     
                $(ele).kbaseCpd({data: data, ids: scope.ids});
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });
        }
    };
})
.directive('jsonviewer', function() {
    return {
        link: function(scope, ele, attrs) {
            $(ele).append('<b>Sorry!</b>  No landing page is available for this object. \
                            In the meantime, view the JSON below or consider contributing.')

            $(ele).loading()
            var p = kb.req('ws', 'get_object', 
                    {workspace: scope.ws, id: scope.id})
            $.when(p).done(function(data) {
                var data = data;
                $(ele).rmLoading();
                scope.data = data;
                displayData(data);
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });

            function displayData(data) {
                $(ele).append('<h3>Metadata</h3><br>');
                var c = $('<div id="metadata">');
                $(ele).append(c);
                c.JSONView(JSON.stringify(data.metadata));

                $(ele).append('<h3>Data</h3><br>');
                var c = $('<div id="data">');
                $(ele).append(c);
                c.JSONView(JSON.stringify(data.data))
            }
        }
    };
})


.directive('backbutton', function() {
    return {
        link: function(scope, ele, attrs) {
            $(ele).on('click', function() {
                window.history.back();
            });
        }

    };
})

.directive('genomeoverview', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Genome Overview',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading(); 
            $(p.body()).KBaseGenomeOverview({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb})
        }
    };
})
.directive('genomewiki', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Genome Wiki',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            $(p.body()).KBaseWikiDescription({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb})
        }
    };
})



/* START new placement in sortable rows for genome landing page */

.directive('sortablegenomeoverview', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Genome Overview',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseGenomeOverview({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})
.directive('sortablegenomewikidescription', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Description',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseWikiDescription({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})



.directive('sortabletaxonomyinfo', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Taxonomy',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseGenomeLineage({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})

.directive('sortabletree', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Species Tree',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();

            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }

            var objectIdentity = { ref:scope.ws+"/"+scope.id };
            kb.ws.list_referencing_objects([objectIdentity], function(data) {
            	var treeName = null;
            	for (var i in data[0]) {
            		var objInfo = data[0][i]
            		var wsName = objInfo[7];
                    var objName = objInfo[1];
                    var type = objInfo[2].split('-')[0];
                	//console.log("Links: " + wsName + "(" + scope.ws + ")" + "/" + objName + ", " + type);
                    if (wsName === scope.ws && type === "KBaseTrees.Tree") {
                    	treeName = objName;
                    	break;
                    }
            	}
            	if (treeName) {
                    $(p.body()).kbaseTree({treeID: treeName, workspaceID: scope.ws});           		
            	} else {
                    
                    var createTreeNar = function() {
                        $(p.body()).empty();
                        $(p.body()).append("<b> creating your narrative, please hold on...<br>");
                                        
                        $.getJSON( "assets/data/speciesTreeNarrativeTemplate.json", function( data ) {
                          
                          var narData = data;
                          // genome name
                          narData["worksheets"][0]["cells"][0]["metadata"]["kb-cell"]["widget_state"][0]['state']['param0'] = scope.id;
                          // number
                          narData["worksheets"][0]["cells"][0]["metadata"]["kb-cell"]["widget_state"][0]['state']['param1'] = "20";
                          // tree name
                          narData["worksheets"][0]["cells"][0]["metadata"]["kb-cell"]["widget_state"][0]['state']['param2'] = scope.id+".tree";
                          narData["metadata"]["data_dependencies"] = [
                            "KBaseGenomes.Genome "+scope.id
                          ];
                          var metadata = narData["metadata"];
                          metadata["data_dependencies"] = "";// not sure format of this... JSON.stringify(metadata["data_dependencies"]);
                          var objSaveData = {
                            type:"KBaseNarrative.Narrative",
                            data:narData,
                            name:scope.id+".tree.narrative",
                            meta:metadata,
                            provenance:[]
                          };
                          var saveParams = {
                            objects:[objSaveData]
                          };
                          if (/^\d+$/.exec(scope.ws))
                            saveParams['id'] = scope.ws;
                          else
                            saveParams['workspace'] = scope.ws;
                          
                          kb.ws.save_objects(saveParams,
                                    function(result) {
                                        $(p.body()).empty();
                                        $(p.body()).append("<b> Successfully created a new Narrative named "+result[0][1]+"!<br>");
                                        window.location.href="/narrative/ws."+result[0][6]+".obj."+result[0][0];
                                    },
                                    function(error) {
                                        $(p.body()).empty();
                                        $(p.body()).append("<b>Unable to create Narrative.</b>  You probably do not have write permissions to this workspace.</b><br><br>");
                                        
                                        $(p.body()).append("You should copy this Genome to a workspace that you have access to, and build a species tree there.<br><br>");
                                        $(p.body()).append("<i>Error was:</i><br>"+error.error.message+"<br><br>");
                                    });
                          
                        });
                    }
                    
                    var $buildNarPanel = $("<div>").append($("<button>")
                           .addClass("btn btn-primary")
                           .append("Build Species Tree")
                           .attr("type", "button")
                           .on("click", 
                               function(event) {
                                   createTreeNar();
                               })
                           );
                    
                    $(p.body())
                        .append('<b>There are no species trees created for this genome, but you can use the Narrative to build a new species tree with related genomes.</b>');
                        
                    $(p.body()).append("<br><br>");
                    $(p.body()).append($buildNarPanel);
                    $(p.body()).append("<br><br>");
            	}
            },
            function(error) {
        		var err = '<b>Sorry!</b>  Error retreiveing species trees info';
        		if (typeof error === "string") {
                    err += ": " + error;
        		} else if (error.error && error.error.message) {
                    err += ": " + error.error.message;
        		}
                $(p.body()).append(err);
            });
        }
    };
})

.directive('sortablecontigbrowser', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Contig Browser',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseMultiContigBrowser({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})
.directive('sortableseedannotations', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Functional Categories',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseSEEDFunctions({objNameOrId: scope.id, wsNameOrId: scope.ws, objVer: null, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})
.directive('sortablerelatedpublications', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Related Publications',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            
            var objId = scope.ws + "/" + scope.id;
	    kb.ws.get_object_subset( [ {ref:objId, included:["/scientific_name"]} ], function(data) {
                    var searchTerm = "";
                    if (data[0]) {
                        if (data[0]['data']['scientific_name']) {
                            searchTerm = data[0]['data']['scientific_name'];
                        }
                    }
                    $(p.body()).KBaseLitWidget({literature:searchTerm, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
                },
                function(error) {
                    console.error("Trying to get scientific name for genome for related publication widget");
                    console.error(error);
                    $(p.body()).KBaseLitWidget({literature:"", kbCache: kb});
                });
        }
    };
})


.directive('sortablenarrativereflist', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Narratives using this Genome',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseNarrativesUsingData({objNameOrId: scope.id, wsNameOrId: scope.ws, objVer: null, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})
.directive('sortableuserreflist', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'People using this Genome',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseWSObjRefUsers({objNameOrId: scope.id, wsNameOrId: scope.ws, objVer: null, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif"});
        }
    };
})
.directive('sortablereferencelist', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'List of data objects referencing this Genome',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseWSReferenceList({objNameOrId: scope.id, wsNameOrId: scope.ws, objVer: null, kbCache: kb,
                                            loadingImage: "assets/img/ajax-loader.gif" });
        }
    };
})
.directive('sortableobjrefgraphview', function($rootScope) {
    return {
        link: function(scope, ele, attrs) {
            var p = $(ele).kbasePanel({title: 'Object Reference and Provenance Graph',
                                           rightLabel: scope.ws,
                                           subText: scope.id});
            p.loading();
            // hack until search links directly to WS objects
            if (scope.ws === "CDS") { scope.ws = "KBasePublicGenomesV3" }
            $(p.body()).KBaseWSObjGraphCenteredView({objNameOrId: scope.id, wsNameOrId: scope.ws, kbCache: kb});
        }
    };
})



/* END new placement in sortable rows for genome landing page */




