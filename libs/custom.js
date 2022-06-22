function _get_collaborator(code) {
    var docCollaborator,
        iID = OptInt(code);

    if (iID != undefined) {
        docCollaborator = ArrayOptFirstElem(
            tools.xquery('for $elem in collaborators where $elem/id = ' + iID + ' return $elem/id,$elem/__data')
        );

        if (docCollaborator != undefined) {
            iID = docCollaborator.PrimaryKey.Value;

            docCollaborator = OpenDoc(UrlFromDocID(iID));
        } else iID = undefined;
    }

    if (iID == undefined) {
        docCollaborator = ArrayOptFirstElem(
            tools.xquery(
                'for $elem in collaborators where $elem/code = ' + XQueryLiteral(code) + ' return $elem/id,$elem/__data'
            )
        );

        if (docCollaborator != undefined) {
            iID = docCollaborator.PrimaryKey.Value;

            docCollaborator = OpenDoc(UrlFromDocID(iID));
        } else {
            docCollaborator = undefined;
        }
    }

    return docCollaborator;
}

function AttachOrgToPerson(org_name, person_id) {
    var docOrg = ArrayOptFirstElem(
        tools.xquery("for $elem in orgs where $elem/name = " + XQueryLiteral(org_name) + " return $elem")
    );
    alert("XQueryLiteral(org_name): "+ XQueryLiteral(org_name))
    if (docOrg != undefined) {
        alert("doc org finded with id: "+ docOrg.PrimaryKey.Value)
        iID = docOrg.PrimaryKey.Value;
        docOrg = OpenDoc(UrlFromDocID(iID));
    } else {
        docOrg = undefined;
    }

    var docPerson = ArrayOptFirstElem(
        tools.xquery('for $elem in collaborators where $elem/id = ' + OptInt(person_id) + ' return $elem')
    );
    if (docPerson != undefined) {
        alert("doc person finded")
        iID = docPerson.PrimaryKey.Value;
        docPerson = OpenDoc(UrlFromDocID(iID));
    } else {
        docPerson = undefined;
        alert("doc person not finded")
    }
    if (docOrg != undefined && docPerson != undefined) {
        //TODO привязать организацию
        docPerson.TopElem.org_id = docOrg.TopElem.id;
        docPerson.TopElem.org_name = docOrg.TopElem.name;

        docPerson.TopElem.lastname = 'Анисимов-Дураков------';
        docPerson.Save();
        return 'Success';
    }
}

function PostOrganization(code, name) {
    // if (tools_library.string_is_null_or_empty(code)) throw 'Empty code';
    if (tools_library.string_is_null_or_empty(name)) throw 'Empty name';
    org = tools.new_doc_by_name('org');
    org.BindToDb(DefaultDb);

    var id = org.DocID
    org.TopElem.name = name;
    org.TopElem.disp_name = name;
    if (code == undefined){
       org.TopElem.code = id; 
    }else{
        org.TopElem.code = code
    }
    org.Save();
    return 'Organization created';
}

function GetOrganizations(){

    var arr = ArraySelectAll(XQuery("for $elem in orgs return $elem"))
    var res = []
    for ( o in arr ) {
        res.push({name: o.name, code: o.code})
    }
    alert(EncodeJson(res))
    return EncodeJson(res);
    
}

function PostEmployee(
    code,
    lastname,
    login,
    firstname,
    middlename,
    // sex,
    birth_date,
    email,
    position_name,
    department_name,
    password,
    org_name,
    subdivision_name
) {
    if (tools_library.string_is_null_or_empty(lastname)) throw 'Empty lastname';

    if (tools_library.string_is_null_or_empty(login)) throw 'Empty login';

    var iResType,
        docCollaborator = _get_collaborator(code);

    if (docCollaborator != undefined) iResType = 0;
    else {
        docCollaborator = tools.new_doc_by_name('collaborator');

        docCollaborator.BindToDb(DefaultDb);

        docCollaborator.TopElem.code = code;

        iResType = 1;
    }

    docCollaborator.TopElem.lastname = lastname;

    if (firstname != null && firstname != undefined && Trim(firstname) != '')
        docCollaborator.TopElem.firstname = firstname;

    if (middlename != null && middlename != undefined && Trim(middlename) != '')
        docCollaborator.TopElem.middlename = middlename;

    if (password != null && password != undefined && Trim(password) != '') docCollaborator.TopElem.password = password;

    // if (sex != null && sex != undefined && Trim(sex) != '')
    //     docCollaborator.TopElem.sex = sex == 'w' || sex == 'W' ? 'w' : 'm';

    birth_date = tools.opt_date(birth_date);

    if (birth_date != undefined) docCollaborator.TopElem.birth_date = birth_date;

    docCollaborator.TopElem.login = login;

    if (email != null && email != undefined && Trim(email) != '') docCollaborator.TopElem.email = email;

    //create

    //position
    var docPosition = undefined;
    if (position_name != null && position_name != undefined && Trim(position_name) != '') {
        if (docCollaborator.TopElem.position_id.HasValue) {
            docPosition = tools.open_doc(docCollaborator.TopElem.position_id);
        }
        if (docPosition == undefined) {
            docPosition = tools.new_doc_by_name('position');
            docPosition.BindToDb(DefaultDb);
        }
        docPosition.TopElem.name = UnifySpaces(position_name);
        docPosition.TopElem.basic_collaborator_id = docCollaborator.DocID;
        docPosition.TopElem.basic_collaborator_id.sd.fullname = docCollaborator.TopElem.fullname;
    }

    //org_name
    var docOrg = undefined;
    if (org_name != null && org_name != undefined && Trim(org_name) != '') {
        if (docCollaborator.TopElem.org_id.HasValue) {
            docOrg = tools.open_doc(docCollaborator.TopElem.org_id);
        }
        if (docOrg == undefined) {
            docOrg = tools.new_doc_by_name('org');
            docOrg.BindToDb(DefaultDb);
            docOrg.TopElem.name = UnifySpaces(org_name);
        }
    }
    if (docOrg != undefined) {
        docCollaborator.TopElem.org_id = docOrg.DocID;
        docCollaborator.TopElem.org_name = docOrg.TopElem.name;

        //привязка должности к организации
        //  if (docPosition != undefined){
        //     docPosition.TopElem.parent_object_id = catSubdivisionParam.PrimaryKey;
        //     docPosition.TopElem.org_id = catSubdivisionParam.org_id;
        //     docCollaborator.TopElem.position_parent_id = catSubdivisionParam.PrimaryKey;
        //     docCollaborator.TopElem.position_parent_name = catSubdivisionParam.name.Value;
        // }


        docOrg.Save();
    }

    

    var catSubdivisionParam = undefined;

    if (department_code != null && department_code != undefined) {
        department_code = Trim(department_code);
        if (department_code != '' && docPosition != undefined) {
            catSubdivisionParam = OptInt(department_code, undefined);
            if (catSubdivisionParam != undefined) {
                catSubdivisionParam = ArrayOptFirstElem(
                    XQuery(
                        'for $elem in subdivisions where $elem/id = ' +
                            catSubdivisionParam +
                            " return $elem/Fields('id','name','org_id')"
                    )
                );
            }

            if (catSubdivisionParam == undefined) {
                catSubdivisionParam = ArrayOptFirstElem(
                    XQuery(
                        'for $elem in subdivisions where $elem/code = ' +
                            XQueryLiteral(department_code) +
                            " return $elem/Fields('id','name','org_id')"
                    )
                );
            }

            if (catSubdivisionParam != undefined) {
                docPosition.TopElem.parent_object_id = catSubdivisionParam.PrimaryKey;
                docPosition.TopElem.org_id = catSubdivisionParam.org_id;
                docCollaborator.TopElem.position_parent_id = catSubdivisionParam.PrimaryKey;
                docCollaborator.TopElem.position_parent_name = catSubdivisionParam.name.Value;
            } else throw 'Invalid department_code';
        }
    }



    if (docPosition != undefined) {
        docCollaborator.TopElem.position_id = docPosition.DocID;
        docPosition.Save();
    }

    docCollaborator.Save();

    return iResType == 1 ? 'User created' : 'User updated';
}

function AssignCourse(code_person, course_id){
    tools.activate_course_to_person(OptInt(collaborator_id, 0), OptInt(_course_id, 0));
}

function GetCourses(){
    var arr = ArraySelectAll(XQuery("for $elem in courses return $elem"))
    var res = []
    for ( o in arr ) {
        res.push({name: o.name, code: o.code, id: o.id, status: o.status})
    }
    alert(EncodeJson(res))
    return EncodeJson(res);
}

function Set_info(code, lastname, firstname, middlename, sex, birth_date, login, email, position_name, department_code)   {

    if (tools_library.string_is_null_or_empty(lastname))
                throw "Empty lastname";
   if (tools_library.string_is_null_or_empty(login))
                throw "Empty login";
   var iResType, docCollaborator = _get_collaborator(code);
    if (docCollaborator != undefined)
                iResType = 0;
    else   {
                docCollaborator = tools.new_doc_by_name("collaborator");
                docCollaborator.BindToDb(DefaultDb);
                docCollaborator.TopElem.code = code;
                iResType = 1;
    }

    docCollaborator.TopElem.lastname = lastname;
    if (firstname != null && firstname != undefined && Trim(firstname) != "")
                docCollaborator.TopElem.firstname = firstname;
    if (middlename != null && middlename != undefined && Trim(middlename) != "")
                docCollaborator.TopElem.middlename = middlename;
    if (sex != null && sex != undefined && Trim(sex) != "")
                docCollaborator.TopElem.sex = (sex == "w" || sex == "W" ? "w" : "m");
    birth_date = tools.opt_date(birth_date);
    if (birth_date != undefined)
                docCollaborator.TopElem.birth_date = birth_date;
    docCollaborator.TopElem.login = login;

    if (email != null && email != undefined && Trim(email) != "")
                docCollaborator.TopElem.email = email;

    var docPosition = undefined;
    if (position_name != null && position_name != undefined && Trim(position_name) != "")   {
                if (docCollaborator.TopElem.position_id.HasValue)  {
                            docPosition = tools.open_doc(docCollaborator.TopElem.position_id);
                }
               if (docPosition == undefined)   {
                            docPosition = tools.new_doc_by_name("position");
                            docPosition.BindToDb(DefaultDb);
                }
               docPosition.TopElem.name = UnifySpaces(position_name);
                docPosition.TopElem.basic_collaborator_id = docCollaborator.DocID;
                docPosition.TopElem.basic_collaborator_id.sd.fullname = docCollaborator.TopElem.fullname;

    }

    var catSubdivisionParam = undefined;
    if (department_code != null && department_code != undefined)   {
                department_code = Trim(department_code);
                if (department_code != "" && docPosition != undefined)   {
                            catSubdivisionParam = OptInt(department_code, undefined);
                            if (catSubdivisionParam != undefined)   {
                                        catSubdivisionParam = ArrayOptFirstElem(XQuery('for $elem in subdivisions where $elem/id = ' +
                                                   catSubdivisionParam + ' return $elem/Fields(\'id\',\'name\',\'org_id\')'));
                            }
                            if (catSubdivisionParam == undefined)   {
                                        catSubdivisionParam = ArrayOptFirstElem(XQuery('for $elem in subdivisions where $elem/code = ' +
                                                    XQueryLiteral(department_code) + ' return $elem/Fields(\'id\',\'name\',\'org_id\')'));
                            }
                            if (catSubdivisionParam != undefined)    {
                                        docPosition.TopElem.parent_object_id = catSubdivisionParam.PrimaryKey;
                                        docPosition.TopElem.org_id = catSubdivisionParam.org_id;
                                        docCollaborator.TopElem.position_parent_id = catSubdivisionParam.PrimaryKey;
                                        docCollaborator.TopElem.position_parent_name = catSubdivisionParam.name.Value;
                            }
                            else
                                        throw "Invalid department_code";
                }

    }

    if (docPosition != undefined)  {
                docCollaborator.TopElem.position_id = docPosition.DocID;
                docPosition.Save();
    }

   docCollaborator.Save();

    return (iResType == 1 ? "User created" : "User updated");

} 
