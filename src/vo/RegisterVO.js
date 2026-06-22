export default class RegisterVO {
    constructor(username = '', password = '', realName = '', phone = '', teacherNo = '', email = '') {
        this.username = username
        this.password = password
        this.realName = realName
        this.phone = phone
        this.teacherNo = teacherNo
        this.email = email
    }
}