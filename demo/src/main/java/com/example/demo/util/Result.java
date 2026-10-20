package com.example.demo.util;

import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String msg;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> res = new Result<>();
        res.code = 200;
        res.msg = "success";
        res.data = data;
        return res;
    }

    public static <T> Result<T> error(String msg) {
        Result<T> res = new Result<>();
        res.code = 500;
        res.msg = msg;
        return res;
    }
}