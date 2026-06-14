using FluentValidation;

namespace WorkForceManager.Application.Features.OfficeLocations.Commands.SaveOfficeLocation;

public class SaveOfficeLocationCommandValidator : AbstractValidator<SaveOfficeLocationCommand>
{
    public SaveOfficeLocationCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.AllowedIpRanges).MaximumLength(1000);
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90).When(x => x.Latitude.HasValue);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180).When(x => x.Longitude.HasValue);
        RuleFor(x => x.RadiusMeters).InclusiveBetween(0, 100000);
    }
}
