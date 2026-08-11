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
    public Result<List<SpecialProduct>> list(@RequestParam(defaultValue = "zh") String lang) {
        return Result.ok(productService.listActive(lang));
    }

    @GetMapping("/{id}")
    public Result<Object> detail(@PathVariable Long id,
                                 @RequestParam(defaultValue = "zh") String lang) {
        return Result.ok(productService.getDetail(id, lang));
    }
}
