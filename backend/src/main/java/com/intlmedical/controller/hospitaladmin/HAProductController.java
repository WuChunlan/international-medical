package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.SpecialProductMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/products")
@RequiredArgsConstructor
public class HAProductController {

    private final SpecialProductMapper specialProductMapper;

    @GetMapping
    public Result<IPage<SpecialProduct>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        IPage<SpecialProduct> result = specialProductMapper.selectPage(new Page<>(page, size),
            new LambdaQueryWrapper<SpecialProduct>()
                .eq(SpecialProduct::getHospitalId, hospitalId)
                .orderByAsc(SpecialProduct::getSortOrder));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody SpecialProduct product) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        product.setHospitalId(hospitalId);
        product.setAuditStatus("pending");
        product.setRejectionReason(null);
        specialProductMapper.insert(product);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody SpecialProduct product) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        SpecialProduct existing = specialProductMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        product.setId(id);
        product.setHospitalId(hospitalId);
        product.setAuditStatus("pending");
        product.setRejectionReason(null);
        specialProductMapper.updateById(product);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        SpecialProduct existing = specialProductMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        specialProductMapper.deleteById(id);
        return Result.ok();
    }
}
