package com.intlmedical.controller;

import com.intlmedical.entity.Hospital;
import com.intlmedical.service.HospitalService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @GetMapping
    public Result<List<Hospital>> list() {
        return Result.ok(hospitalService.listActive());
    }

    @GetMapping("/{id}")
    public Result<Object> detail(@PathVariable Long id) {
        return Result.ok(hospitalService.getDetail(id));
    }
}
