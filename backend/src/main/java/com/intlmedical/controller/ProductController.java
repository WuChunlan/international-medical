package com.intlmedical.controller;

import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.service.SpecialProductService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final SpecialProductService productService;

    @GetMapping
    public Result<List<SpecialProduct>> list() {
        return Result.ok(productService.listActive());
    }

    @GetMapping("/{id}")
    public Result<Object> detail(@PathVariable Long id) {
        return Result.ok(productService.getDetail(id));
    }
}
