package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.dto.request.HAProductRequest;
import com.intlmedical.entity.PendingChange;
import com.intlmedical.entity.ProductVariant;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.PendingChangeMapper;
import com.intlmedical.mapper.ProductVariantMapper;
import com.intlmedical.mapper.SpecialProductMapper;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hospital-admin/products")
@RequiredArgsConstructor
public class HAProductController {

    private final SpecialProductMapper specialProductMapper;
    private final PendingChangeMapper pendingChangeMapper;
    private final PendingChangeService pendingChangeService;
    private final ProductVariantMapper productVariantMapper;

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
        List<PendingChange> pending = pendingChangeMapper.selectPendingByType("products");
        Set<Long> pendingIds = pending.stream()
            .map(PendingChange::getEntityId)
            .collect(Collectors.toSet());
        result.getRecords().forEach(p -> p.setHasPendingEdit(pendingIds.contains(p.getId())));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody HAProductRequest req) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Long userId = SecurityUtil.getCurrentUserId();
        // 先插 shell 记录以拿到真实 ID（参照 HAHospitalController 做法）
        SpecialProduct product = new SpecialProduct();
        product.setHospitalId(hospitalId);
        product.setNameZh(req.getNameZh() != null ? req.getNameZh() : "");
        product.setNameEn(req.getNameEn() != null ? req.getNameEn() : "");
        product.setSummaryZh(req.getSummaryZh());
        product.setSummaryEn(req.getSummaryEn());
        product.setDetailZh(req.getDetailZh());
        product.setDetailEn(req.getDetailEn());
        product.setCoverImageUrl(req.getCoverImageUrl());
        product.setPriceMin(req.getPriceMin());
        product.setPriceMax(req.getPriceMax());
        product.setContactPerson(req.getContactPerson());
        product.setContactInfo(req.getContactInfo());
        product.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        product.setIsActive(0);
        product.setAuditStatus("pending");
        specialProductMapper.insert(product);
        try {
            pendingChangeService.submitNewDraftWithEntityId("products", req, product.getId(), userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody HAProductRequest req) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        SpecialProduct existing = specialProductMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        Long userId = SecurityUtil.getCurrentUserId();
        try {
            pendingChangeService.submitEdit("products", id, req, userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
        return Result.ok();
    }

    @GetMapping("/{id}/variants")
    public Result<List<ProductVariant>> listVariants(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        SpecialProduct existing = specialProductMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        List<ProductVariant> variants = productVariantMapper.selectList(
            new LambdaQueryWrapper<ProductVariant>()
                .eq(ProductVariant::getProductId, id)
                .eq(ProductVariant::getIsActive, 1)
                .orderByAsc(ProductVariant::getSortOrder));
        return Result.ok(variants);
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
